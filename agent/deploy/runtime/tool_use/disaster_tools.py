"""
화재 대응 도구 모음
"""
from typing import Dict, Any
import wikipedia as wiki
import requests
from strands import tool
import boto3
import json
import math
from config import WINDY_API_KEY, WINDY_API_URL

@tool
def wikipedia(query: str) -> Dict[str, Any]:
    """위키피디아에서 정보를 검색합니다.
    Args:
        query: 검색어
    Returns:
        검색 결과를 담은 딕셔너리
    """
    try:
        wiki.set_lang("ko")
        page = wiki.page(query)
        summary = page.summary
        if len(summary) > 500:
            summary = summary[:500] + "..."

        return {
            "success": True,
            "title": page.title,
            "summary": summary,
            "url": page.url
        }

    except wiki.exceptions.DisambiguationError as e:
        return {
            "success": False,
            "error": "여러 결과가 발견되었습니다",
            "options": e.options[:5]
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

@tool
def find_fire_station(address: str) -> str:
    """화재 발생 시 주소를 기반으로 가까운 소방서 5곳을 벡터 검색으로 찾습니다.
    Args:
        address: 한국 주소 (예: 서울특별시 서초구 방배중앙로 06681)
    Returns:
        소방서 5곳의 정보 문자열 (LLM이 최적의 소방서를 판단할 수 있도록)
    """
    try:
        print(f"🔍 주소 검색: {address}")
        
        bedrock = boto3.client("bedrock-runtime", region_name="us-west-2")
        s3vectors = boto3.client("s3vectors", region_name="us-west-2")
        
        # 주소를 임베딩으로 변환
        embedding_response = bedrock.invoke_model(
            modelId="amazon.titan-embed-text-v2:0",
            body=json.dumps({
                "inputText": address,
                "dimensions": 1024,
                "normalize": True
            })
        )
        
        embedding_body = json.loads(embedding_response["body"].read())
        query_embedding = embedding_body["embedding"]
        
        print(f"✅ 임베딩 생성 완료")
        
        # S3 Vectors로 유사도 검색 (상위 5개)
        search_response = s3vectors.query_vectors(
            vectorBucketName="firestation-location-xy",
            indexName="fire-station",
            queryVector={"float32": query_embedding},
            topK=5,
            returnMetadata=True
        )
        
        if search_response.get("vectors"):
            result = f"화재 발생 주소: {address}\n\n"
            result += "가까운 소방서 5곳 :\n\n"
            
            for idx, vector_item in enumerate(search_response["vectors"], 1):
                metadata = vector_item.get("metadata", {})
                score = vector_item.get("score", 0)
                
                name = metadata.get("name", "소방서")
                station_address = metadata.get("address", "")
                lat = metadata.get("latitude", "")
                lon = metadata.get("longitude", "")
                phone = metadata.get("phone", "")
                
                result += f"{idx}. {name}\n"
                result += f"   - 위도: {lat}, 경도: {lon}\n"
                result += f"   - 주소: {station_address}\n"
                result += f"   - 전화번호: {phone}\n"
                
                print(f"✅ 소방서 {idx}: {name} (점수: {score:.4f})")
            
            return result
        else:
            return "소방서를 찾을 수 없습니다."

    except Exception as e:
        print(f"❌ 오류 발생: {str(e)}")
        return f"오류 발생: {str(e)}"


@tool
def get_weather_info(latitude: float, longitude: float) -> str:
    """Windy API를 사용해 기상 정보를 조회합니다.
    Args:
        latitude: 위도 (prompt에서 받은 값)
        longitude: 경도 (prompt에서 받은 값)
    Returns:
        기상 정보 문자열
    """
    try:
        print(f"🌤️ 기상 정보 조회: 위도={latitude}, 경도={longitude}")
        
        payload = {
            "lat": latitude,
            "lon": longitude,
            "model": "gfs",
            "parameters": ["wind", "temp", "rh", "pressure"],
            "levels": ["surface"],
            "key": WINDY_API_KEY
        }

        response = requests.post(WINDY_API_URL, json=payload, timeout=10)
        response.raise_for_status()
        data = response.json()

        # 첫 번째 시간대 데이터 사용
        if data and data.get("ts"):
            idx = 0
            wind_u = data.get("wind_u-surface", [0])[idx]
            wind_v = data.get("wind_v-surface", [0])[idx]
            temp_k = data.get("temp-surface", [273.15])[idx]
            humidity = data.get("rh-surface", [0])[idx]
            pressure = data.get("pressure-surface", [1013])[idx]

            # 계산
            wind_speed = math.sqrt(wind_u**2 + wind_v**2)
            wind_dir = (math.atan2(wind_u, wind_v) * 180 / math.pi + 180) % 360
            temp_c = temp_k - 273.15

            # 주소 조회
            address = get_address_from_coords(latitude, longitude).replace(',', ' ')

            result = f"위도: {latitude}, 경도: {longitude}\n"
            result += f"주소: {address}\n"
            result += f"온도: {temp_c:.1f}°C\n"
            result += f"풍속: {wind_speed:.1f} m/s\n"
            result += f"풍향: {wind_dir:.0f}°\n"
            result += f"습도: {humidity}%\n"
            result += f"기압: {pressure} hPa"
            
            print(f"✅ 기상 정보 조회 완료")
            return result
        else:
            return "기상 정보를 가져올 수 없습니다."
            
    except Exception as e:
        print(f"❌ 오류 발생: {str(e)}")
        return f"기상 정보 조회 오류: {str(e)}"


def get_address_from_coords(lat: float, lon: float) -> str:
    """좌표를 주소로 변환합니다 (Nominatim 사용)"""
    try:
        url = f"https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lon}&accept-language=ko"
        response = requests.get(url, headers={"User-Agent": "DisasterMonitoring/1.0"}, timeout=10)
        data = response.json()
        
        addr = data.get("address", {})
        parts = []
        
        # 시/도
        if addr.get("city"):
            parts.append(addr["city"])
        elif addr.get("province"):
            parts.append(addr["province"])
        
        # 구/군
        if addr.get("borough"):
            parts.append(addr["borough"])
        elif addr.get("suburb"):
            parts.append(addr["suburb"])
        
        # 도로명
        if addr.get("road"):
            parts.append(addr["road"])
        
        # 번지
        if addr.get("house_number"):
            parts.append(addr["house_number"])
        
        # 우편번호
        if addr.get("postcode"):
            parts.append(addr["postcode"])
        
        result = " ".join(parts) if parts else data.get("display_name", f"{lat:.6f}, {lon:.6f}")
        return result
        
    except Exception as e:
        print(f"❌ 주소 변환 오류: {str(e)}")
        return f"{lat:.6f}, {lon:.6f}"
