import boto3
import json
import re
from flask import Flask, request, Response, stream_with_context
from flask_cors import CORS
from botocore.config import Config

app = Flask(__name__)
CORS(app)

config = Config(
    read_timeout=3000,
    connect_timeout=600,
    retries={'max_attempts': 0}
)

client = boto3.client('bedrock-agentcore', region_name='us-west-2', config=config)

@app.route('/analyze', methods=['POST'])
def analyze():
    data = request.json
    prompt = data.get('prompt', '')
    actor_id = data.get('actor_id', 'default-user')
    session_id = data.get('session_id', 'default-session')
    
    payload = json.dumps({
        "prompt": prompt,
        "actor_id": actor_id,
        "session_id": session_id
    }).encode()
    
    response = client.invoke_agent_runtime(
        agentRuntimeArn='arn:aws:bedrock-agentcore:us-west-2:277707126943:runtime/agent_runtime-vQguH72Lr7',
        runtimeSessionId='1fmeoagmreaklgmrkleafremoigrmtesogmtrskhmtkrl2shmt22',
        payload=payload
    )
    
    def generate():
        if "text/event-stream" in response.get("contentType", ""):
            for line in response["response"].iter_lines(chunk_size=10):
                if line:
                    line = line.decode("utf-8")
                    if line.startswith("data: "):
                        match = re.search(r"'data':\s*'([^']*)'", line)
                        if match:
                            yield match.group(1)
    
    return Response(stream_with_context(generate()), content_type='text/plain; charset=utf-8')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8082, debug=True)
