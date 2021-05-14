import * as ecs from '@aws-cdk/aws-ecs';
import * as logs from '@aws-cdk/aws-logs';
import * as cdk from '@aws-cdk/core';

export interface CeleryBeatProps {
  readonly image: ecs.ContainerImage;
  readonly command: string[];
  readonly environment: { [key: string]: string };
  readonly cluster: ecs.ICluster;
}

export class CeleryBeat extends cdk.Construct {
  constructor(scope: cdk.Construct, id: string, props: CeleryBeatProps) {
    super(scope, id);


    const taskDefinition = new ecs.TaskDefinition(scope, `TaskDefinitionFor${id}`, {
      compatibility: ecs.Compatibility.FARGATE,
      cpu: '256',
      memoryMiB: '512',
    });

    taskDefinition.addContainer(`TaskContainerFor${id}`, {
      image: props.image,
      command: props.command,
      environment: props.environment,
      logging: ecs.LogDriver.awsLogs(
        {
          logRetention: logs.RetentionDays.ONE_DAY,
          streamPrefix: `${id}Container`,
        },
      ),
    });

    new ecs.FargateService(scope, `FargateService${id}`, {
      cluster: props.cluster,
      taskDefinition,
      // only run one instance of celery beat
      desiredCount: 1,
    });
  }
}