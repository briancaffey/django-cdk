// https://github.com/aws-samples/aws-cdk-examples/blob/master/typescript/static-site/static-site.ts#L113
import * as fs from 'fs';
import * as path from 'path';
import * as cdk from '@aws-cdk/core';
import * as cloudfront from '@aws-cdk/aws-cloudfront';
import * as s3 from '@aws-cdk/aws-s3';
import * as s3Deployment from '@aws-cdk/aws-s3-deployment';
import * as targets from '@aws-cdk/aws-route53-targets';

import { DnsValidatedCertificate } from '@aws-cdk/aws-certificatemanager';
import { ARecord, PublicHostedZone, RecordTarget } from '@aws-cdk/aws-route53';

export interface StaticSiteProps {

  /**
   * Path to static site distribution directory
   */
  readonly pathToDist: string;

  /**
   * The zoneName of the hosted zone
   */
  readonly zoneName: string;
  /**
   * Domain name for static site (including sub-domain)
   */
  readonly domainName: string;

  /**
    * Certificate ARN
    */
  readonly certificateArn?: string;

  /**
  * Public Hosted Zone
  *
  * consider this as a possible prop so that we can
  * share the same HostedZone between multiple stacks
  */
  // readonly publicHostedZone: IHostedZone;
}

export class StaticSite extends cdk.Construct {
  constructor(scope: cdk.Construct, id: string, props: StaticSiteProps) {
    super(scope, id);

    console.log("test...")
    const dir = path.join(process.cwd(), props.pathToDist);
    console.log(dir);
    const files = fs.existsSync(path.join(process.cwd(), props.pathToDist))
    console.log(files);
    // throw new Error("testing...");

    // this S3 bucket will contain the static site assets
    const staticSiteBucket = new s3.Bucket(this, 'StaticSiteBucket');

    const hostedZone = new PublicHostedZone(scope, 'HostedZone', {
      zoneName: props.zoneName,
    });

    // create the certificate if it doesn't exist
    // TODO: optionally look up the certificate from props.certificateArn
    const certificate = new DnsValidatedCertificate(scope, 'Certificate', {
      domainName: props.domainName,
      hostedZone,
    });

    // create the cloudfront web distribution
    const distribution = new cloudfront.CloudFrontWebDistribution(this, 'StaticSiteDistribution', {
      originConfigs: [
        {
          s3OriginSource: {
            s3BucketSource: staticSiteBucket,
          },
          behaviors: [{ isDefaultBehavior: true }],
        },
      ],
      viewerCertificate: cloudfront.ViewerCertificate.fromAcmCertificate(certificate),
    });

    // if there is a directory called in the pathToDist directory, create a new S3 Deployment
    if (fs.existsSync(path.join(process.cwd(), props.pathToDist))) {
      console.log("creating bucket distribution")
      // create a new S3 Deployment
      new s3Deployment.BucketDeployment(scope, 'BucketDeployment', {
        sources: [s3Deployment.Source.asset(path.join(process.cwd(), props.pathToDist))],
        destinationBucket: staticSiteBucket,
        distribution,
      })
    }


    // create the A Record that will point to the CloudFront distribution
    new ARecord(scope, 'RecordTarget', {
      target: RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution)),
      zone: hostedZone,
      // note that the recordName must end with a period (.)
      recordName: `${props.domainName}.`,
    });

  }
}