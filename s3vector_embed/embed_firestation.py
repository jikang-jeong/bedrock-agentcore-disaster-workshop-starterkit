"""
소방서 데이터를 S3 Vectors에 임베딩하여 저장
"""
import boto3
import json
import pandas as pd
import os

bedrock = boto3.client("bedrock-runtime", region_name="us-west-2")
s3vectors = boto3.client("s3vectors", region_name="us-west-2")

# CSV 파일 경로
script_dir = os.path.dirname(os.path.abspath(__file__))
csv_path = os.path.join(script_dir, '..', 'misc', 'firestation.csv')

# CSV 읽기
df = pd.read_csv(csv_path, encoding='euc-kr')

print(f"총 {len(df)}개의 소방서 데이터를 처리합니다.")

vectors = []
for idx, row in df.iterrows():
    # X좌표, Y좌표가 이미 위경도
    latitude = float(row['X좌표'])
    longitude = float(row['Y좌표'])
    
    # 소방서 정보를 텍스트로 변환
    text = f"{row['소방서 및 안전센터명']} , 위치: {row['주소']} , 소속: {row['상위 본부명']} , 위도: {latitude:.6f} , 경도: {longitude:.6f}"
    
    print(f"처리중 [{idx+1}/{len(df)}]: {row['소방서 및 안전센터명']}")
    
    # Bedrock으로 임베딩 생성
    response = bedrock.invoke_model(
        modelId="amazon.titan-embed-text-v2:0",
        body=json.dumps({
            "inputText": text,
            "dimensions": 1024,
            "normalize": True
        })
    )
    
    response_body = json.loads(response["body"].read())
    embedding = response_body["embedding"]
    
    vectors.append({
        "key": f"firestation_{idx}",
        "data": {"float32": embedding},
        "metadata": {
            "name": str(row['소방서 및 안전센터명']),
            "address": str(row['주소']),
            "phone": str(row['전화번호']),
            "latitude": str(latitude),
            "longitude": str(longitude),
            "type": str(row['유형']),
            "headquarters": str(row['상위 본부명'])
        }
    })
    
    # 50개씩 배치로 저장
    if len(vectors) == 50:
        s3vectors.put_vectors(
            vectorBucketName="firestation-location-xy",
            indexName="fire-station",
            vectors=vectors
        )
        print(f"✅ {idx+1}개 저장 완료")
        vectors = []

# 남은 데이터 저장
if vectors:
    s3vectors.put_vectors(
        vectorBucketName="firestation-location-xy",
        indexName="fire-station",
        vectors=vectors
    )
    print(f"✅ 최종 {len(df)}개 저장 완료")

print("🎉 모든 소방서 데이터 임베딩 완료!")
