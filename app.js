// ============================================
// 전역 변수
// ============================================
let map;
let currentLayer;
let fireMarkers = [];
let clickedMarkers = new Set();
let lastClickedMarker = null;
let weatherDataCache = {}; // 기상 데이터 캐시
let currentFireLocation = null; // 현재 클릭한 화재 마커 정보

// 드래그 관련 변수
let isDraggingWeather = false;
let isDraggingInfo = false;
let isResizingInfo = false;
let dragOffsetX = 0;
let dragOffsetY = 0;

// 이벤트 마커 관리
const eventMarkers = {
    address: [],
    example1: [],
    example2: []
};

const eventMarkerIcons = {
    address: L.icon({
        iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiI+PGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTIiIGZpbGw9IiMwMDdmZmYiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSIyIi8+PHRleHQgeD0iMTYiIHk9IjIxIiBmb250LXNpemU9IjE2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjZmZmIj7wn5qSPC90ZXh0Pjwvc3ZnPg==',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
    }),
    example1: L.icon({
        iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiI+PGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTIiIGZpbGw9IiMwMGM4NTMiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSIyIi8+PHRleHQgeD0iMTYiIHk9IjIxIiBmb250LXNpemU9IjE2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjZmZmIj7wn5+iPC90ZXh0Pjwvc3ZnPg==',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
    }),
    example2: L.icon({
        iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiI+PGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTIiIGZpbGw9IiNmZmFhMDAiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSIyIi8+PHRleHQgeD0iMTYiIHk9IjIxIiBmb250LXNpemU9IjE2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjZmZmIj7imqDvuI88L3RleHQ+PC9zdmc+',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
    })
};

// ============================================
// 이벤트 파서
// ============================================
class EventParser {
    constructor() {
        this.buffer = '';
        this.eventPattern = /<event\s+type=\\?"(.+?)\\?"[^>]*>(.*?)<\/event>/gs;
        this.handlers = {
            'geocode': this.handleGeocode.bind(this),
            'address': this.handleAddress.bind(this),
            'windy': this.handleWindy.bind(this),
            'example1': this.handleExample1.bind(this),
            'example2': this.handleExample2.bind(this)
        };
    }
    
    parse(chunk) {
        this.buffer += chunk;
        
        // \\n을 실제 줄바꿈으로 변환 (정규식 매칭 전에)
        const normalizedBuffer = this.buffer.replace(/\\n/g, '\n');
        
        // 완성된 태그만 찾기
        let match;
        const processedMatches = [];
        
        while ((match = this.eventPattern.exec(normalizedBuffer)) !== null) {
            const type = match[1];
            const content = match[2];
            
            processedMatches.push({
                fullMatch: match[0],
                type: type,
                content: content
            });
        }
        
        // 정규식 lastIndex 리셋
        this.eventPattern.lastIndex = 0;
        
        // 핸들러 실행
        processedMatches.forEach(item => {
            if (this.handlers[item.type]) {
                this.handlers[item.type](item.content);
            }
            // 처리된 태그 제거 (원본 buffer에서)
            this.buffer = this.buffer.replace(item.fullMatch.replace(/\n/g, '\\n'), '');
        });
    }
    
    async handleGeocode(data) {
        console.log('🌍 Geocode event received:', data);
        
        try {
            // 형식: "위도,경도,라벨"
            const parts = data.split(',');
            if (parts.length >= 2) {
                const lat = parseFloat(parts[0].trim());
                const lon = parseFloat(parts[1].trim());
                const label = parts.length > 2 ? parts.slice(2).join(',').trim() : '소방서';
                
                console.log('✅ Parsed coordinates:', { lat, lon, label });
                addEventMarker('address', lat, lon, label);
            } else {
                console.error('❌ Invalid geocode format:', data);
            }
        } catch (error) {
            console.error('❌ Geocode parsing error:', error);
        }
    }
    
    async handleAddress(address) {
        console.log('🚒 Address event received:', address);
        
        const coords = await geocodeAddress(address);
        console.log('📍 Geocoding result:', coords);
        
        if (coords) {
            console.log('✅ Adding marker at:', coords.lat, coords.lon);
            addEventMarker('address', coords.lat, coords.lon, address);
        } else {
            console.error('❌ Geocoding failed for:', address);
        }
    }
    
    handleWindy(data) {
        console.log('🌤️ Windy event received:', data);
        
        try {
            // 형식: "위도,경도,온도,풍속,풍향,습도,기압,주소"
            const parts = data.split(',');
            if (parts.length >= 7) {
                const lat = parseFloat(parts[0].trim());
                const lon = parseFloat(parts[1].trim());
                const temp = parts[2].trim();
                const windSpeed = parts[3].trim();
                const windDir = parts[4].trim();
                const humidity = parts[5].trim();
                const pressure = parts[6].trim();
                const address = parts.length > 7 ? parts.slice(7).join(',').trim() : '화재 발생 지점';
                
                console.log('✅ Parsed weather data:', { lat, lon, temp, windSpeed, windDir, humidity, pressure, address });
                
                // 클릭한 화재 마커 위치 사용 (currentFireLocation이 있으면 우선 사용)
                const displayLat = currentFireLocation ? currentFireLocation.lat : lat;
                const displayLon = currentFireLocation ? currentFireLocation.lon : lon;
                const displayAddress = currentFireLocation ? currentFireLocation.address : address;
                
                showWeatherPanel(displayLat, displayLon, displayAddress, temp, windSpeed, windDir, humidity, pressure);
            } else {
                console.error('❌ Invalid windy format:', data);
            }
        } catch (error) {
            console.error('❌ Windy parsing error:', error);
        }
    }
    
    handleExample1(data) {
        console.log('Example1 event:', data);
        try {
            const parsed = JSON.parse(data);
            if (parsed.route) {
                const polyline = L.polyline(parsed.route, {
                    color: 'blue',
                    weight: 3
                }).addTo(map);
                eventMarkers.example1.push(polyline);
            }
        } catch (e) {
            console.error('Example1 parse error:', e);
        }
    }
    
    handleExample2(data) {
        console.log('Example2 event:', data);
        try {
            const parsed = JSON.parse(data);
            const alertDiv = document.createElement('div');
            alertDiv.style.cssText = `
                position: fixed;
                top: 80px;
                right: 20px;
                background: ${parsed.level > 2 ? '#ff4444' : '#ffaa00'};
                color: white;
                padding: 15px;
                border-radius: 8px;
                z-index: 2000;
                box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            `;
            alertDiv.textContent = `⚠️ ${parsed.alert} (Level ${parsed.level})`;
            document.body.appendChild(alertDiv);
            
            setTimeout(() => alertDiv.remove(), 5000);
        } catch (e) {
            console.error('Example2 parse error:', e);
        }
    }
}

// ============================================
// Geocoding (주소 → 좌표)
// ============================================
async function geocodeAddress(address) {
    console.log('🔍 Geocoding request for:', address);
    
    try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&accept-language=ko`;
        console.log('📡 API URL:', url);
        
        const response = await fetch(url, {
            headers: { 'User-Agent': 'DisasterMonitoring/1.0' }
        });
        
        console.log('📥 Response status:', response.status);
        
        const data = await response.json();
        console.log('📦 API response:', data);
        
        if (data.length > 0) {
            const coords = {
                lat: parseFloat(data[0].lat),
                lon: parseFloat(data[0].lon)
            };
            console.log('✅ Coordinates found:', coords);
            return coords;
        } else {
            console.warn('⚠️ No results from Nominatim for:', address);
        }
    } catch (error) {
        console.error('❌ Geocoding error:', error);
    }
    return null;
}

// ============================================
// 이벤트 마커 추가
// ============================================
function addEventMarker(type, lat, lon, label) {
    const marker = L.marker([lat, lon], { icon: eventMarkerIcons[type] })
        .addTo(map)
        .bindPopup(`<strong>${label}</strong>`);
    
    // 마커 호버 이벤트
    marker.on('mouseover', function() {
        const icon = this.getElement();
        if (icon) {
            icon.style.width = '48px';
            icon.style.height = '48px';
            icon.style.marginLeft = '-24px';
            icon.style.marginTop = '-24px';
        }
    });
    
    marker.on('mouseout', function() {
        const icon = this.getElement();
        if (icon) {
            icon.style.width = '32px';
            icon.style.height = '32px';
            icon.style.marginLeft = '-16px';
            icon.style.marginTop = '-16px';
        }
    });
    
    // 극적인 등장 애니메이션 (멀리서 날아오는 효과)
    const markerElement = marker.getElement();
    if (markerElement) {
        // 초기 상태: 20배 크기 + 위쪽에서 시작
        markerElement.style.transform = 'scale(20) translateY(-200px)';
        markerElement.style.opacity = '0';
        markerElement.style.transition = 'transform 1s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.5s ease-out';
        
        // 애니메이션 시작
        setTimeout(() => {
            markerElement.style.transform = 'scale(1) translateY(0)';
            markerElement.style.opacity = '1';
        }, 50);
        
        // 등장 애니메이션 완료 후 호버 transition 설정
        setTimeout(() => {
            markerElement.style.transition = 'all 0.2s ease-in-out';
        }, 1100);
        
        // 팝업 자동 표시 (애니메이션 후)
        setTimeout(() => {
            marker.openPopup();
        }, 1100);
        
        // 클릭 시 바운스 애니메이션
        marker.on('click', function() {
            const icon = this.getElement();
            if (icon) {
                icon.style.animation = 'markerBounce 0.8s ease-out';
                setTimeout(() => {
                    icon.style.animation = '';
                }, 800);
            }
        });
    }
    
    eventMarkers[type].push(marker);
    
    // 지도 이동 (부드럽게)
    map.flyTo([lat, lon], 14, {
        duration: 1.5,
        easeLinearity: 0.25
    });
}

// ============================================
// 기상정보 패널 표시
// ============================================
async function showWeatherPanel(lat, lon, address, temp, windSpeed, windDir, humidity, pressure) {
    const weatherPanel = document.getElementById('weatherPanel');
    const weatherContent = document.getElementById('weatherContent');
    
    weatherPanel.classList.add('active');
    
    // 지도 중심 이동
    map.setView([lat, lon], 15, { animate: true });
    
    // 마커의 화면 좌표 계산
    setTimeout(() => {
        const markerPoint = map.latLngToContainerPoint([lat, lon]);
        weatherPanel.style.left = (markerPoint.x - 120) + 'px';
        weatherPanel.style.top = (markerPoint.y - 250) + 'px';
        weatherPanel.style.right = 'auto';
        weatherPanel.style.bottom = 'auto';
    }, 100);
    
    // 패널 내용 업데이트
    weatherContent.innerHTML = `
        <div style="margin-bottom: 10px;"><strong>📍 위치:</strong> ${address}</div>
        <hr style="margin: 10px 0; border: none; border-top: 1px solid #ddd;">
        <div style="line-height: 1.8;">
            <div>🌡️ <strong>온도:</strong> ${temp}°C</div>
            <div>💨 <strong>풍속:</strong> ${windSpeed} m/s</div>
            <div>🧭 <strong>풍향:</strong> ${windDir}°</div>
            <div>💧 <strong>습도:</strong> ${humidity}%</div>
            <div>📊 <strong>기압:</strong> ${pressure} hPa</div>
        </div>
    `;
    
    // 바람 애니메이션 표시
    const weatherData = {
        wind: {
            speed: parseFloat(windSpeed),
            direction: parseFloat(windDir)
        }
    };
    await updateWindAnimationForLocation(lat, lon, weatherData);
}

// ============================================
// 기상정보 패널 드래그
// ============================================
function initWeatherPanelDrag() {
    const panel = document.getElementById('weatherPanel');
    const header = document.getElementById('weatherPanelHeader');
    
    header.addEventListener('mousedown', (e) => {
        isDraggingWeather = true;
        dragOffsetX = e.clientX - panel.offsetLeft;
        dragOffsetY = e.clientY - panel.offsetTop;
        header.style.cursor = 'grabbing';
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isDraggingWeather) return;
        
        const x = e.clientX - dragOffsetX;
        const y = e.clientY - dragOffsetY;
        
        panel.style.left = x + 'px';
        panel.style.top = y + 'px';
        panel.style.right = 'auto';
        panel.style.bottom = 'auto';
    });
    
    document.addEventListener('mouseup', () => {
        if (isDraggingWeather) {
            isDraggingWeather = false;
            header.style.cursor = 'move';
        }
    });
}

function initInfoPanelDrag() {
    const panel = document.getElementById('infoPanel');
    const header = panel.querySelector('h3');
    const resizeHandle = document.getElementById('resizeHandle');
    
    let infoDragOffsetX = 0;
    let infoDragOffsetY = 0;
    let startWidth = 0;
    let startHeight = 0;
    let startX = 0;
    let startY = 0;
    
    // 드래그 (헤더)
    header.addEventListener('mousedown', (e) => {
        if (e.target === resizeHandle) return;
        isDraggingInfo = true;
        infoDragOffsetX = e.clientX - panel.offsetLeft;
        infoDragOffsetY = e.clientY - panel.offsetTop;
        header.style.cursor = 'grabbing';
    });
    
    // 리사이즈 (핸들)
    resizeHandle.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        isResizingInfo = true;
        startWidth = panel.offsetWidth;
        startHeight = panel.offsetHeight;
        startX = e.clientX;
        startY = e.clientY;
    });
    
    document.addEventListener('mousemove', (e) => {
        if (isDraggingInfo) {
            const x = e.clientX - infoDragOffsetX;
            const y = e.clientY - infoDragOffsetY;
            
            panel.style.left = x + 'px';
            panel.style.top = y + 'px';
            panel.style.right = 'auto';
            panel.style.bottom = 'auto';
        }
        
        if (isResizingInfo) {
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            const newWidth = Math.max(300, startWidth + deltaX);
            const newHeight = Math.max(200, startHeight + deltaY);
            
            panel.style.width = newWidth + 'px';
            panel.style.height = newHeight + 'px';
        }
    });
    
    document.addEventListener('mouseup', () => {
        if (isDraggingInfo) {
            isDraggingInfo = false;
            header.style.cursor = 'move';
        }
        if (isResizingInfo) {
            isResizingInfo = false;
        }
    });
}

function closeWeatherPanel() {
    const weatherPanel = document.getElementById('weatherPanel');
    weatherPanel.style.animation = 'fadeOut 0.3s ease-in-out forwards';
    setTimeout(() => {
        weatherPanel.classList.remove('active');
        weatherPanel.style.animation = '';
    }, 300);
}

// ============================================
// 주소 변환 (Nominatim)
// ============================================
async function getAddressFromCoords(lat, lon) {
    try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=ko`;
        const response = await fetch(url, {
            headers: { 'User-Agent': 'DisasterMonitoring/1.0' }
        });
        const data = await response.json();
        
        // 한글 주소 추출
        const addr = data.address;
        if (addr) {
            const parts = [];
            if (addr.city) parts.push(addr.city);
            else if (addr.province) parts.push(addr.province);
            if (addr.borough) parts.push(addr.borough);
            else if (addr.suburb) parts.push(addr.suburb);
            if (addr.neighbourhood) parts.push(addr.neighbourhood);
            if (addr.road) parts.push(addr.road);
            if (addr.postcode) parts.push(addr.postcode);
            return parts.join(' ') || data.display_name;
        }
        return data.display_name;
    } catch (error) {
        console.error('Address lookup error:', error);
        return `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
    }
}

// ============================================
// 초기화
// ============================================
function init() {
    initMap();
    initWeatherPanelDrag();
    initInfoPanelDrag();
}

function initMap() {
    map = L.map('map').setView(MAP_CONFIG.mapCenter, MAP_CONFIG.mapZoom);
    currentLayer = L.tileLayer(MAP_CONFIG.layers.standard, {
        attribution: '© OpenStreetMap'
    }).addTo(map);
    
    // 화재 지점 마커 추가
    addFireMarkers();
}

// ============================================
// 레이어 변경
// ============================================
function changeLayerByButton(layerType) {
    // 모든 버튼의 active 클래스 제거
    document.querySelectorAll('.layer-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // 클릭된 버튼에 active 클래스 추가
    event.target.classList.add('active');
    
    // 레이어 변경
    map.removeLayer(currentLayer);
    currentLayer = L.tileLayer(MAP_CONFIG.layers[layerType], {
        attribution: '© OpenStreetMap'
    }).addTo(map);
}

function changeLayer() {
    const select = document.getElementById('layerSelect');
    const layerType = select.value;
    
    map.removeLayer(currentLayer);
    currentLayer = L.tileLayer(MAP_CONFIG.layers[layerType], {
        attribution: '© OpenStreetMap'
    }).addTo(map);
}

function addFireMarkers() {
    const fireIcon = L.icon({
        iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiI+PGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTIiIGZpbGw9IiNmZjAwMDAiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSIyIi8+PHRleHQgeD0iMTYiIHk9IjIxIiBmb250LXNpemU9IjE2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjZmZmIj7wn5SlPC90ZXh0Pjwvc3ZnPg==',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16]
    });
    
    // 초기 마커 생성
    generateRandomFireMarkers(fireIcon);
}

function generateRandomFireMarkers(fireIcon) {
    // 기존 마커 제거
    fireMarkers.forEach(m => map.removeLayer(m.marker));
    fireMarkers = [];
    clickedMarkers.clear();
    lastClickedMarker = null;
    
    // 대한민국 주요 도시 좌표 (전국 고르게 분포, 총 50개)
    const cities = [
        { name: '서울', lat: 37.5665, lon: 126.9780, radius: 0.15, count: 8 },
        { name: '부산', lat: 35.1796, lon: 129.0756, radius: 0.12, count: 6 },
        { name: '대구', lat: 35.8714, lon: 128.6014, radius: 0.10, count: 5 },
        { name: '인천', lat: 37.4563, lon: 126.7052, radius: 0.10, count: 5 },
        { name: '광주', lat: 35.1595, lon: 126.8526, radius: 0.08, count: 4 },
        { name: '대전', lat: 36.3504, lon: 127.3845, radius: 0.08, count: 4 },
        { name: '울산', lat: 35.5384, lon: 129.3114, radius: 0.08, count: 3 },
        { name: '세종', lat: 36.4800, lon: 127.2890, radius: 0.06, count: 2 },
        { name: '경기', lat: 37.4138, lon: 127.5183, radius: 0.20, count: 5 },
        { name: '강원', lat: 37.8228, lon: 128.1555, radius: 0.15, count: 3 },
        { name: '충북', lat: 36.6357, lon: 127.4914, radius: 0.12, count: 2 },
        { name: '충남', lat: 36.5184, lon: 126.8000, radius: 0.12, count: 2 },
        { name: '전북', lat: 35.7175, lon: 127.1530, radius: 0.10, count: 2 },
        { name: '전남', lat: 34.8679, lon: 126.9910, radius: 0.12, count: 2 },
        { name: '경북', lat: 36.4919, lon: 128.8889, radius: 0.15, count: 3 },
        { name: '경남', lat: 35.4606, lon: 128.2132, radius: 0.12, count: 3 },
        { name: '제주', lat: 33.4996, lon: 126.5312, radius: 0.08, count: 1 }
    ];
    
    let markerIndex = 0;
    
    cities.forEach(city => {
        for (let i = 0; i < city.count; i++) {
            const angle = Math.random() * 2 * Math.PI;
            const distance = Math.random() * city.radius;
            
            const lat = city.lat + distance * Math.cos(angle);
            const lon = city.lon + distance * Math.sin(angle);
            
            const locationName = `${city.name}-화재${i + 1}`;
            
            const marker = L.marker([lat, lon], { icon: fireIcon })
                .addTo(map);
            
            // 마커 호버 이벤트 (CSS transition 사용)
            const markerElement = marker.getElement();
            if (markerElement) {
                markerElement.style.transition = 'all 0.2s ease-in-out';
            }
            
            marker.on('mouseover', function() {
                const icon = this.getElement();
                if (icon) {
                    icon.style.width = '48px';
                    icon.style.height = '48px';
                    icon.style.marginLeft = '-24px';
                    icon.style.marginTop = '-24px';
                }
            });
            
            marker.on('mouseout', function() {
                const icon = this.getElement();
                if (icon) {
                    icon.style.width = '32px';
                    icon.style.height = '32px';
                    icon.style.marginLeft = '-16px';
                    icon.style.marginTop = '-16px';
                }
            });
            
            // 마커 클릭 이벤트
            marker.on('click', async () => {
                // 바운스 애니메이션
                const icon = marker.getElement();
                if (icon) {
                    icon.style.animation = 'markerBounce 0.8s ease-out';
                    setTimeout(() => {
                        icon.style.animation = '';
                    }, 800);
                }
                
                // 같은 마커 재클릭 시 무시
                if (lastClickedMarker === locationName) {
                    return;
                }
                
                // 다른 마커 클릭 시
                lastClickedMarker = locationName;
                clickedMarkers.add(locationName);
                
                // 지도 중심 이동
                map.setView([lat, lon], 15, { animate: true });
                
                // 주소 조회
                const address = await getAddressFromCoords(lat, lon);
                
                // 현재 화재 위치 저장
                currentFireLocation = {
                    lat: lat,
                    lon: lon,
                    address: address,
                    name: locationName
                };
                
                console.log('🔥 화재 마커 선택됨:', currentFireLocation);
            });
            
            fireMarkers.push({ 
                name: locationName, 
                marker: marker,
                lat: lat,
                lon: lon
            });
            
            markerIndex++;
        }
    });
    
    console.log(`✅ Generated ${markerIndex} fire markers across South Korea`);
}

// ============================================
// Markdown to HTML 변환
// ============================================
function markdownToHtml(text) {
    return text
        // ### 제목 (h3)
        .replace(/^### (.+)$/gm, '<h3 style="margin: 16px 0 8px 0; color: #1d1d1f; font-size: 18px;">$1</h3>')
        // ## 제목 (h2)
        .replace(/^## (.+)$/gm, '<h2 style="margin: 18px 0 10px 0; color: #1d1d1f; font-size: 20px;">$1</h2>')
        // # 제목 (h1)
        .replace(/^# (.+)$/gm, '<h1 style="margin: 20px 0 12px 0; color: #1d1d1f; font-size: 22px;">$1</h1>')
        // **굵게**
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        // *기울임*
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        // 숫자 목록
        .replace(/^\d+\.\s+(.+)$/gm, '<div style="margin-left: 20px; margin-bottom: 6px;">• $1</div>')
        // - 목록
        .replace(/^-\s+(.+)$/gm, '<div style="margin-left: 20px; margin-bottom: 6px;">• $1</div>');
}

// ============================================
// 챗봇 메시지 전송
// ============================================
async function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const prompt = input.value.trim();
    
    if (!prompt) return;
    
    input.value = '';
    
    const infoPanel = document.getElementById('infoPanel');
    if (!infoPanel.classList.contains('active')) {
        infoPanel.classList.add('active');
    }
    
    const content = document.getElementById('infoContent');
    if (!content) {
        console.error('❌ infoContent element not found');
        return;
    }
    
    // 기존 내용 유지하고 새 질문 추가
    const existingContent = content.innerHTML;
    content.innerHTML = existingContent + `
        <hr style="margin: 20px 0; border: none; border-top: 2px solid rgba(0,0,0,0.1);">
        <p><strong>질문:</strong> ${prompt}</p>
        <div style="text-align: center; padding: 10px;">
            <div class="spinner"></div>
        </div>
    `;
    
    // 스크롤 최하단으로
    content.scrollTop = content.scrollHeight;
    
    try {
        const response = await fetch(ENV.AGENT_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                prompt: prompt,
                actor_id: ENV.USER_ID,
                session_id: ENV.SESSION_ID
            })
        });
        
        if (!response.ok) throw new Error('Network response was not ok');
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        const parser = new EventParser();
        let result = '';
        
        // 로딩 제거하고 스트리밍 영역 추가
        content.innerHTML = existingContent + `
            <hr style="margin: 20px 0; border: none; border-top: 2px solid rgba(0,0,0,0.1);">
            <p><strong>질문:</strong> ${prompt}</p>
            <div class="streaming-response" style="font-size: 13px; line-height: 1.6; margin-top: 10px;"></div>
            <div class="streaming-spinner" style="text-align: center; padding: 10px;">
                <div class="spinner"></div>
                <div style="margin-top: 8px; font-size: 12px; color: #666;">응답 생성 중...</div>
            </div>
        `;
        
        // 마지막에 추가된 요소들 찾기
        const allStreamingDivs = content.querySelectorAll('.streaming-response');
        const streamingDiv = allStreamingDivs[allStreamingDivs.length - 1];
        const spinnerDiv = content.querySelector('.streaming-spinner:last-child');
        
        while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
                // 스트리밍 완료 시 스피너 제거
                if (spinnerDiv && spinnerDiv.parentNode) {
                    spinnerDiv.remove();
                }
                break;
            }
            
            const chunk = decoder.decode(value, { stream: true });
            result += chunk;
            
            // 이벤트 파싱 (원본 chunk 사용)
            parser.parse(chunk);
            
            // UI 업데이트 (이벤트 태그 제거 후 줄바꿈 처리)
            const displayText = result
                .replace(/\\n/g, '\n')  // \\n을 실제 줄바꿈으로 변환
                .replace(/<event\s+type=\\?"[^"\\]+\\?"[^>]*>.*?<\/event>/gs, '')  // 이벤트 태그 제거
                .replace(/\[antml:function_calls\][\s\S]*?\[\/antml:function_calls\]/g, '')  // tool 호출 태그 제거
                .replace(/([^\n])(\[[^\]]+\])/g, '$1\n$2')  // 모든 [텍스트] 앞에 줄바꿈
                .replace(/(\[[^\]]+\])\n+/g, '$1\n')  // [텍스트] 뒤의 여러 줄바꿈을 하나로
                .replace(/\\+$/gm, '')  // 줄 끝의 백슬래시 제거
                .replace(/\\\s*$/g, '');  // 문장 끝의 백슬래시와 공백 제거
            
            if (streamingDiv) {
                streamingDiv.innerHTML = markdownToHtml(displayText).replace(/\n/g, '<br>');
            }
            
            // 자동 스크롤 (최신 내용으로)
            if (content) {
                content.scrollTop = content.scrollHeight;
            }
        }
        
    } catch (error) {
        if (content) {
            content.innerHTML += `
                <div style="color: #d32f2f; padding: 10px; margin-top: 10px; border-radius: 8px; background: rgba(211, 47, 47, 0.1);">
                    <strong>⚠️ 에이전트 연결 실패</strong>
                </div>
            `;
        }
        console.error('Agent call error:', error);
    }
}

// ============================================
// 에이전트 호출 (수동 - 버튼 클릭)
// ============================================
async function callAgentManual() {
    if (!currentFireLocation) {
        alert('먼저 화재 마커를 클릭해주세요.');
        return;
    }
    
    callAgent(currentFireLocation.lat, currentFireLocation.lon, currentFireLocation.address);
}

// ============================================
// 에이전트 호출
// ============================================
async function callAgent(lat, lon, address) {
    const infoPanel = document.getElementById('infoPanel');
    
    // 패널이 이미 열려있으면 닫지 않고 계속 진행
    if (!infoPanel.classList.contains('active')) {
        infoPanel.classList.add('active');
    }
    
    const content = document.getElementById('infoContent');
    
    // 로딩 표시
    content.innerHTML = `
        <div style="text-align: center; padding: 20px;">
            <div class="spinner"></div>
            <div style="margin-top: 12px;">AI 에이전트 분석 중...</div>
        </div>
    `;
    
    // 프롬프트 생성 (위도/경도 포함)
    const prompt = `화재 발생 지점: ${address}\n위도: ${lat}, 경도: ${lon}\n\n화재가 발생했다!!!!!`;
    
    const requestPayload = { 
        prompt: prompt,
        actor_id: ENV.USER_ID,
        session_id: ENV.SESSION_ID
    };
    
    console.log('📤 [ANALYZE REQUEST]', requestPayload);
    
    try {
        const response = await fetch(ENV.AGENT_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestPayload)
        });
        
        if (!response.ok) throw new Error('Network response was not ok');
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        const parser = new EventParser();
        let result = '';
        
        content.innerHTML = `
            <div class="streaming-response" style="font-size: 13px; line-height: 1.6;"></div>
            <div class="streaming-spinner" style="text-align: center; padding: 10px;">
                <div class="spinner"></div>
                <div style="margin-top: 8px; font-size: 12px; color: #666;">응답 생성 중...</div>
            </div>
        `;
        
        const streamingDiv = content.querySelector('.streaming-response');
        const spinnerDiv = content.querySelector('.streaming-spinner');
        
        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                // 스트리밍 완료 시 스피너 제거
                spinnerDiv.remove();
                break;
            }
            
            const chunk = decoder.decode(value, { stream: true });
            result += chunk;
            
            // 이벤트 파싱 (원본 chunk 사용)
            parser.parse(chunk);
            
            // UI 업데이트 (이벤트 태그 제거 후 줄바꿈 처리)
            const displayText = result
                .replace(/\\n/g, '\n')  // \\n을 실제 줄바꿈으로 변환
                .replace(/<event\s+type=\\?"[^"\\]+\\?"[^>]*>.*?<\/event>/gs, '')  // 이벤트 태그 제거
                .replace(/([^\n])(\[[^\]]+\])/g, '$1\n$2')  // 모든 [텍스트] 앞에 줄바꿈
                .replace(/(\[[^\]]+\])\n+/g, '$1\n')  // [텍스트] 뒤의 여러 줄바꿈을 하나로
                .replace(/\\+$/gm, '')  // 줄 끝의 백슬래시 제거
                .replace(/\\\s*$/g, '');  // 문장 끝의 백슬래시와 공백 제거
            streamingDiv.innerHTML = markdownToHtml(displayText).replace(/\n/g, '<br>');
            
            content.scrollTop = content.scrollHeight;
        }
        
    } catch (error) {
        content.innerHTML = `
            <div style="color: #d32f2f; padding: 20px; text-align: center;">
                <strong>⚠️ 에이전트 연결 실패</strong>
                <p style="margin-top: 10px; font-size: 14px;">
                    Flask 서버가 실행 중인지 확인하세요.<br>
                    <code>python main.py</code>
                </p>
            </div>
        `;
        console.error('Agent call error:', error);
    }
}

// ============================================
// 앱 시작
// ============================================
window.onload = init;
