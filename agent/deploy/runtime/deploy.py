import logging

# AWS SDK
import boto3
from bedrock_agentcore.runtime import BedrockAgentCoreApp
# Bedrock AgentCore
from bedrock_agentcore_starter_toolkit import Runtime
from boto3.session import Session
# Strands Agents
from strands import Agent, tool
from strands.models import BedrockModel
from strands_tools import calculator

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

boto_session = Session()
region = "us-west-2"
account_id = boto3.client('sts').get_caller_identity()['Account']

print(f"Region: {region}")
print(f"Account ID: {account_id}")
print(f"환경 변수 설정 완료")

# Runtime 인스턴스 생성
agentcore_runtime = Runtime()
agent_name = "agent_runtime"

# Runtime 설정
response = agentcore_runtime.configure(
    entrypoint="bedrock_agent_core.py",
    auto_create_execution_role=True,
    auto_create_ecr=True,
    requirements_file="requirements.txt",
    region=region,
    agent_name=agent_name
)
print(response)

# AgentCore Runtime에 배포
print("🚀 통합 Agent를 AgentCore Runtime에 배포 중...")
launch_result = agentcore_runtime.launch(auto_update_on_conflict=True)

print(f"\n✅ 배포 완료!")
print(f"Agent ARN: {launch_result.agent_arn}")
print(f"ECR URI: {launch_result.ecr_uri}")
