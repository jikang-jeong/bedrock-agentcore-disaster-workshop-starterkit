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
    cctv: [],
    windy: [],
    example1: [],
    example2: []
};

// CCTV 데이터 저장
let cctvData = [];

// 연결선 관리
let connectionLines = [];

// 마커 그룹 (bounds 계산용)
let pendingMarkers = [];
let markerTimeout = null;

const eventMarkerIcons = {
    address: L.icon({
        iconUrl: 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect x="6" y="12" width="20" height="16" fill="#d32f2f" rx="2"/><polygon points="16,4 4,14 28,14" fill="#b71c1c"/><rect x="13" y="18" width="6" height="10" fill="#fff"/><rect x="8" y="14" width="4" height="4" fill="#ffeb3b"/><rect x="20" y="14" width="4" height="4" fill="#ffeb3b"/><circle cx="16" cy="9" r="2" fill="#fff"/></svg>'),
        iconSize: [32, 32],
        iconAnchor: [16, 28]
    }),
    cctv: L.icon({
        iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiI+PGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTIiIGZpbGw9IiM5YzI3YjAiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSIyIi8+PHRleHQgeD0iMTYiIHk9IjIxIiBmb250LXNpemU9IjE0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjZmZmIj7wn5O5PC90ZXh0Pjwvc3ZnPg==',
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
            'cctv': this.handleCctv.bind(this),
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
                addEventMarker('address', lat, lon, label, false);
                
                // 화재 마커와 연결선 그리기 (파란색)
                drawConnectionLine(lat, lon, '#007fff');
                
                // pending에 추가하여 bounds 계산 (화재 지점 + 새 마커)
                if (currentFireLocation && pendingMarkers.length === 0) {
                    pendingMarkers.push([currentFireLocation.lat, currentFireLocation.lon]);
                }
                pendingMarkers.push([lat, lon]);
                scheduleFitBounds();
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
            addEventMarker('address', coords.lat, coords.lon, address, false);
            
            // 화재 마커와 연결선 그리기 (파란색)
            drawConnectionLine(coords.lat, coords.lon, '#007fff');
            
            // pending에 추가하여 bounds 계산
            pendingMarkers.push([coords.lat, coords.lon]);
            scheduleFitBounds();
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
    
    handleCctv(data) {
        console.log('📹 CCTV event received:', data);
        
        try {
            // 형식: "위도,경도,주소,m3u8스트리밍URL"
            const parts = data.split(',');
            if (parts.length >= 4) {
                const lat = parseFloat(parts[0].trim());
                const lon = parseFloat(parts[1].trim());
                const address = parts[2].trim();
                const streamUrl = parts.slice(3).join(',').trim(); // URL에 쉼표가 있을 수 있음
                
                console.log('✅ Parsed CCTV data:', { lat, lon, address, streamUrl });
                
                // 첫 번째 CCTV면 자동 재생
                const isFirst = cctvData.length === 0;
                
                // CCTV 데이터 저장
                cctvData.push({ lat, lon, address, streamUrl });
                
                // CCTV 마커 추가 (flyTo 없이)
                addCctvMarker(lat, lon, address, streamUrl, false);
                
                // 화재 마커와 연결선 그리기 (보라색)
                drawConnectionLine(lat, lon, '#9c27b0');
                
                // 첫 번째 CCTV 자동 재생
                if (isFirst) {
                    setTimeout(() => showCctvPlayer(streamUrl, address), 1200);
                }
                
                // pending에 추가하여 bounds 계산 (화재 지점 + 새 마커)
                if (currentFireLocation && pendingMarkers.length === 0) {
                    pendingMarkers.push([currentFireLocation.lat, currentFireLocation.lon]);
                }
                pendingMarkers.push([lat, lon]);
                scheduleFitBounds();
            } else {
                console.error('❌ Invalid CCTV format:', data);
            }
        } catch (error) {
            console.error('❌ CCTV parsing error:', error);
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

// 마커 일괄 bounds 계산 (여러 마커가 연속으로 추가될 때 한번에 처리)
function scheduleFitBounds() {
    if (markerTimeout) {
        clearTimeout(markerTimeout);
    }
    markerTimeout = setTimeout(() => {
        if (pendingMarkers.length === 1) {
            // 마커가 1개면 정확히 중앙에 위치
            map.flyTo(pendingMarkers[0], 14, { duration: 1.5 });
        } else if (pendingMarkers.length > 1) {
            // 여러 마커면 모두 보이도록 bounds 계산
            const bounds = L.latLngBounds(pendingMarkers);
            map.flyToBounds(bounds, { padding: [50, 50], duration: 1.5, maxZoom: 14 });
        }
        pendingMarkers = [];
        markerTimeout = null;
    }, 500); // 500ms 동안 추가 마커 대기
}

// 화재 마커와 연결선 그리기
function drawConnectionLine(targetLat, targetLon, color = '#007fff') {
    if (!currentFireLocation) return;
    
    const line = L.polyline(
        [[currentFireLocation.lat, currentFireLocation.lon], [targetLat, targetLon]],
        { color: color, weight: 4, opacity: 0.8 }
    ).addTo(map);
    
    connectionLines.push(line);
}

// 연결선 모두 제거
function clearConnectionLines() {
    connectionLines.forEach(line => map.removeLayer(line));
    connectionLines = [];
}

// 이벤트 마커 모두 제거
function clearEventMarkers() {
    Object.keys(eventMarkers).forEach(type => {
        eventMarkers[type].forEach(marker => map.removeLayer(marker));
        eventMarkers[type] = [];
    });
    cctvData = [];
}

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
// CCTV 마커 추가
// ============================================
function addCctvMarker(lat, lon, address, streamUrl, shouldFlyTo = true) {
    const marker = L.marker([lat, lon], { icon: eventMarkerIcons.cctv })
        .addTo(map)
        .bindPopup(`<strong>📹 ${address}</strong><br><a href="#" onclick="showCctvPlayer('${streamUrl}', '${address}'); return false;">영상 보기</a>`);
    
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
    
    // 마커 클릭 시 CCTV 플레이어 표시
    marker.on('click', function() {
        showCctvPlayer(streamUrl, address);
    });
    
    // 애니메이션
    const markerElement = marker.getElement();
    if (markerElement) {
        markerElement.style.transform = 'scale(20) translateY(-200px)';
        markerElement.style.opacity = '0';
        markerElement.style.transition = 'transform 1s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.5s ease-out';
        
        setTimeout(() => {
            markerElement.style.transform = 'scale(1) translateY(0)';
            markerElement.style.opacity = '1';
        }, 50);
        
        setTimeout(() => {
            markerElement.style.transition = 'all 0.2s ease-in-out';
        }, 1100);
    }
    
    eventMarkers.cctv.push(marker);
    
    // 지도 이동 (옵션)
    if (shouldFlyTo) {
        map.flyTo([lat, lon], 14, { duration: 1.5, easeLinearity: 0.25 });
    }
}

// ============================================
// CCTV 플레이어 표시
// ============================================
function showCctvPlayer(streamUrl, address) {
    let cctvPanel = document.getElementById('cctvPanel');
    
    if (!cctvPanel) {
        // 패널이 없으면 생성
        cctvPanel = document.createElement('div');
        cctvPanel.id = 'cctvPanel';
        cctvPanel.className = 'cctv-panel';
        cctvPanel.innerHTML = `
            <div class="cctv-header" id="cctvPanelHeader">
                <h3>📹 CCTV 영상</h3>
                <button class="panel-close" onclick="closeCctvPanel()">✕</button>
            </div>
            <div class="cctv-address" id="cctvAddress"></div>
            <div class="cctv-content">
                <video id="cctvVideo" controls autoplay muted style="width: 100%; height: 100%; background: #000;"></video>
            </div>
        `;
        document.body.appendChild(cctvPanel);
        
        // 드래그 기능 추가
        initCctvPanelDrag();
        
        // HLS.js 로드 (동적)
        if (!window.Hls) {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest';
            script.onload = () => playCctvStream(streamUrl);
            document.head.appendChild(script);
        }
    }
    
    // 주소 업데이트
    document.getElementById('cctvAddress').textContent = address;
    
    // 패널 표시
    cctvPanel.classList.add('active');
    
    // 스트림 재생
    if (window.Hls) {
        playCctvStream(streamUrl);
    }
}

function initCctvPanelDrag() {
    const panel = document.getElementById('cctvPanel');
    const header = document.getElementById('cctvPanelHeader');
    let isDragging = false;
    let offsetX = 0, offsetY = 0;
    
    header.addEventListener('mousedown', (e) => {
        if (e.target.classList.contains('panel-close')) return;
        isDragging = true;
        offsetX = e.clientX - panel.offsetLeft;
        offsetY = e.clientY - panel.offsetTop;
        header.style.cursor = 'grabbing';
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        panel.style.left = (e.clientX - offsetX) + 'px';
        panel.style.top = (e.clientY - offsetY) + 'px';
        panel.style.right = 'auto';
    });
    
    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            header.style.cursor = 'move';
        }
    });
}

function playCctvStream(streamUrl) {
    const video = document.getElementById('cctvVideo');
    
    if (Hls.isSupported()) {
        if (window.cctvHls) {
            window.cctvHls.destroy();
        }
        window.cctvHls = new Hls();
        window.cctvHls.loadSource(streamUrl);
        window.cctvHls.attachMedia(video);
        window.cctvHls.on(Hls.Events.MANIFEST_PARSED, () => {
            video.play();
        });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = streamUrl;
        video.play();
    }
}

function closeCctvPanel() {
    const cctvPanel = document.getElementById('cctvPanel');
    if (cctvPanel) {
        cctvPanel.classList.remove('active');
        if (window.cctvHls) {
            window.cctvHls.destroy();
            window.cctvHls = null;
        }
    }
}

// ============================================
// 이벤트 마커 추가
// ============================================
function addEventMarker(type, lat, lon, label, shouldFlyTo = true) {
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
    
    // 지도 이동 (옵션)
    if (shouldFlyTo) {
        map.flyTo([lat, lon], 14, { duration: 1.5, easeLinearity: 0.25 });
    }
}

// ============================================
// 기상정보 패널 표시
// ============================================
async function showWeatherPanel(lat, lon, address, temp, windSpeed, windDir, humidity, pressure) {
    const weatherPanel = document.getElementById('weatherPanel');
    const weatherContent = document.getElementById('weatherContent');
    
    // 지도 중심 이동
    map.setView([lat, lon], 15, { animate: true });
    
    weatherPanel.classList.add('active');
    
    // 바운스 애니메이션 적용
    weatherPanel.style.animation = 'panelBounce 0.8s ease-out';
    setTimeout(() => {
        weatherPanel.style.animation = '';
    }, 800);
    
    // 마커의 화면 좌표 계산 (지도 이동 후) - 오른쪽에 배치
    setTimeout(() => {
        const markerPoint = map.latLngToContainerPoint([lat, lon]);
        weatherPanel.style.left = (markerPoint.x + 30) + 'px';  // 마커 오른쪽
        weatherPanel.style.top = (markerPoint.y - 100) + 'px';
        weatherPanel.style.right = 'auto';
        weatherPanel.style.bottom = 'auto';
    }, 300);
    
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
    
    // 에이전트 분석 패널 항상 활성화
    document.getElementById('infoPanel').classList.add('active');
    document.getElementById('infoContent').innerHTML = '<p style="color:#666;">화재 마커를 클릭하여 분석을 시작하세요.</p>';
}

// 마커 옆 AI 에이전트 버튼
function showMarkerPopupButton(lat, lon) {
    hideMarkerPopupButton();
    const point = map.latLngToContainerPoint([lat, lon]);
    const btn = document.createElement('button');
    btn.id = 'markerPopupBtn';
    btn.innerHTML = '🤖 AI 어시스턴트 호출';
    btn.style.cssText = `position:absolute;left:${point.x + 20}px;top:${point.y - 15}px;z-index:1000;padding:8px 16px;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:600;box-shadow:0 2px 10px rgba(0,0,0,0.3);`;
    btn.onclick = () => {
        hideMarkerPopupButton();
        callAgent(currentFireLocation.lat, currentFireLocation.lon, currentFireLocation.address);
    };
    document.getElementById('map').appendChild(btn);
}

function hideMarkerPopupButton() {
    const btn = document.getElementById('markerPopupBtn');
    if (btn) btn.remove();
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
        { name: '충남', lat: 36.8188281, lon: 127.1518748 , radius: 0.12, count: 30 },
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
                
                // 다른 마커 클릭 시 - 기존 이벤트 마커와 연결선 정리
                clearConnectionLines();
                clearEventMarkers();
                hideMarkerPopupButton();
                
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
                
                // 마커 옆에 AI 에이전트 버튼 표시
                showMarkerPopupButton(lat, lon);
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
        // ### 제목 - blue bold italic
        .replace(/^### (.+)$/gm, '<strong style="color: blue; font-style: italic;">$1</strong>')
        // ## 제목 - red bold
        .replace(/^## (.+)$/gm, '<strong style="color: red;">$1</strong>')
        // **굵게**
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        // m3u8 URL을 클릭 가능한 링크로
        .replace(/(https?:\/\/[^\s<]+\.m3u8)/g, '<a href="#" onclick="showCctvPlayer(\'$1\', \'CCTV\'); return false;" style="color:#9c27b0;">📹 영상 보기</a>');
}

// ============================================
// WebSocket 연결 관리
// ============================================
let agentWebSocket = null;
let currentStreamingDiv = null;
let wsResult = '';
let eventParser = null;

// Intent 상태 표시
function showIntentStatus(intent, message) {
    const el = document.getElementById('intentStatus');
    el.textContent = `🎯 ${message}`;
    el.className = `intent-status ${intent} visible`;
}

function hideIntentStatus() {
    const el = document.getElementById('intentStatus');
    el.classList.remove('visible');
}

async function connectWebSocket() {
    if (agentWebSocket && agentWebSocket.readyState === WebSocket.OPEN) {
        return agentWebSocket;
    }
    
    try {
        // Flask에서 pre-signed URL 받기
        const response = await fetch('http://localhost:8082/ws-url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: ENV.SESSION_ID })
        });
        const { url, error } = await response.json();
        if (error) throw new Error(error);
        
        // Pre-signed URL로 직접 AgentCore에 연결
        agentWebSocket = new WebSocket(url);
        
        agentWebSocket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                
                // Intent 상태 표시
                if (data.intent) {
                    showIntentStatus(data.intent, data.message);
                    return;
                }
                
                // data 필드에서 텍스트 추출
                if (data.data && currentStreamingDiv) {
                    wsResult += data.data;
                    if (!eventParser) eventParser = new EventParser();
                    eventParser.parse(data.data);
                    
                    const displayText = wsResult
                        .replace(/\\n/g, '\n')
                        .replace(/<event\s+type=\\?"[^"\\]+\\?"[^>]*>.*?<\/event>/gs, '')
                        .replace(/\\+$/gm, '')
                        .replace(/\n{3,}/g, '\n\n')
                        .trim();
                    currentStreamingDiv.innerHTML = markdownToHtml(displayText).replace(/\n/g, '<br>');
                    
                    const content = document.getElementById('infoContent');
                    if (content) content.scrollTop = content.scrollHeight;
                }
                
                // 완료 체크
                if (data.stop || data.end_event_loop) {
                    const spinners = document.querySelectorAll('.streaming-spinner');
                    spinners.forEach(s => s.remove());
                    hideIntentStatus();
                }
            } catch (e) {
                // JSON 파싱 실패 시 무시
            }
        };
        
        agentWebSocket.onerror = (e) => console.error('WebSocket error:', e);
        agentWebSocket.onclose = () => { agentWebSocket = null; };
        
        await new Promise((resolve, reject) => {
            agentWebSocket.onopen = resolve;
            setTimeout(() => reject(new Error('WebSocket timeout')), 5000);
        });
        
        return agentWebSocket;
    } catch (error) {
        console.error('WebSocket connection failed:', error);
        return null;
    }
}

async function sendViaWebSocket(prompt) {
    const ws = await connectWebSocket();
    if (!ws) {
        throw new Error('WebSocket 연결 실패');
    }
    
    wsResult = '';
    eventParser = new EventParser();
    ws.send(JSON.stringify({
        prompt: prompt,
        actor_id: ENV.USER_ID,
        session_id: ENV.SESSION_ID
    }));
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
    if (!content) return;
    
    const existingContent = content.innerHTML;
    content.innerHTML = existingContent + `
        <hr style="margin: 20px 0; border: none; border-top: 2px solid rgba(0,0,0,0.1);">
        <p><strong>질문:</strong> ${prompt}</p>
        <div class="streaming-response" style="font-size: 13px; line-height: 1.6; margin-top: 10px;"></div>
        <div class="streaming-spinner" style="text-align: center; padding: 10px;">
            <div class="spinner"></div>
            <div style="margin-top: 8px; font-size: 12px; color: #666;">응답 생성 중...</div>
        </div>
    `;
    
    const allStreamingDivs = content.querySelectorAll('.streaming-response');
    currentStreamingDiv = allStreamingDivs[allStreamingDivs.length - 1];
    content.scrollTop = content.scrollHeight;
    
    try {
        await sendViaWebSocket(prompt);
    } catch (error) {
        content.innerHTML += `
            <div style="color: #d32f2f; padding: 10px; margin-top: 10px; border-radius: 8px; background: rgba(211, 47, 47, 0.1);">
                <strong>⚠️ 에이전트 연결 실패</strong>
            </div>
        `;
        console.error('Agent call error:', error);
    }
}

// ============================================
// 에이전트 호출 (수동 - 버튼 클릭)
// ============================================
async function callAgentManual() {
    if (currentFireLocation) {
        callAgent(currentFireLocation.lat, currentFireLocation.lon, currentFireLocation.address);
    } else {
        openAnalyzePanel();
    }
}

function openAnalyzePanel() {
    const infoPanel = document.getElementById('infoPanel');
    infoPanel.classList.add('active');
    document.getElementById('infoContent').innerHTML = '<p style="color:#666;">질문을 입력하세요.</p>';
    document.getElementById('chatInput').focus();
}

// ============================================
// 에이전트 호출
// ============================================
async function callAgent(lat, lon, address) {
    const infoPanel = document.getElementById('infoPanel');
    
    if (!infoPanel.classList.contains('active')) {
        infoPanel.classList.add('active');
    }
    
    const content = document.getElementById('infoContent');
    
    // 기존 내용에 추가 (초기화하지 않음)
    const existingContent = content.innerHTML;
    const separator = existingContent && !existingContent.includes('화재 마커를 클릭') ? '<hr style="margin: 20px 0; border: none; border-top: 2px solid rgba(0,0,0,0.1);">' : '';
    
    content.innerHTML = (existingContent.includes('화재 마커를 클릭') ? '' : existingContent) + separator + `
        <div class="streaming-response" style="font-size: 13px; line-height: 1.6;"></div>
        <div class="streaming-spinner" style="text-align: center; padding: 10px;">
            <div class="spinner"></div>
            <div style="margin-top: 8px; font-size: 12px; color: #666;">AI 에이전트 분석 중...</div>
        </div>
    `;
    
    const allStreamingDivs = content.querySelectorAll('.streaming-response');
    currentStreamingDiv = allStreamingDivs[allStreamingDivs.length - 1];
    content.scrollTop = content.scrollHeight;
    
    const prompt = `화재 발생 지점: ${address}\n위도: ${lat}, 경도: ${lon}\n\n화재 상황 발생이 발생 했습니다. 화재 진압 출동 관련하여 대응 방안을 찾아줘. `;
    
    console.log('📤 [ANALYZE REQUEST]', prompt);
    
    try {
        await sendViaWebSocket(prompt);
    } catch (error) {
        content.innerHTML += `
            <div style="color: #d32f2f; padding: 20px; text-align: center;">
                <strong>⚠️ 에이전트 연결 실패</strong>
            </div>
        `;
        console.error('Agent call error:', error);
    }
}

// ============================================
// 앱 시작
// ============================================
window.onload = init;
