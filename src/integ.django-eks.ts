import * as cdk from '@aws-cdk/core';
import { DjangoEks } from './index';

const env = {
    region: process.env.AWS_DEFAULT_REGION || 'us-east-1',
    account: process.env.AWS_ACCOUNT_ID,
  };

const app = new cdk.App();
const stack = new cdk.Stack(app, 'DjangoEks', { env });

const construct = new DjangoEks(stack, 'Cdk-Sample-Lib', {
  imageDirectory: './test/django-step-by-step/backend',
  webCommand: [
    './scripts/start_prod.sh',
  ],
});

/**
 * Add tagging for this construct and all child constructs
 */
cdk.Tags.of(construct).add('stack', 'MyStack');
