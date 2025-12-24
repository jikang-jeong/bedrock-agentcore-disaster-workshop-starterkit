// ============================================
// 지도 설정
// ============================================
const MAP_CONFIG = {
    mapCenter: [36.8188281, 127.1518748],
    mapZoom: 11,
    timeInterval: 30, // 분 단위
    
    layers: {
        standard: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        humanitarian: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
        cyclosm: 'https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png',
        transport: 'https://{s}.tile.thunderforest.com/transport/{z}/{x}/{y}.png',
        landscape: 'https://{s}.tile.thunderforest.com/landscape/{z}/{x}/{y}.png',
        outdoors: 'https://{s}.tile.thunderforest.com/outdoors/{z}/{x}/{y}.png',
        topo: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png'
    }
};