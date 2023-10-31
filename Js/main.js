import OSM from '../ol/source/OSM.js';
import ImageLayer from '../ol/layer/Image.js';
import ImageWMS from '../ol/source/ImageWMS.js';
import TileLayer from '../ol/layer/Tile.js';
import Map from '../ol/Map.js';
import View from '../ol/View.js';


const urls = [
    'taronja:total_w_param',
    'taronja:prueba',
    'taronja:dublin_total_w_param',
    'taronja:sf_prueba',
    'taronja:toluca_prueba'
]

const centers = [
    [-41939.925, 4789023.627],
    [2595606, 5265679],
    [-697650.061, 7047547.004],
    [-13628987.947, 4546670.522],
    [-11093666, 2188226]
]

const wmsSource = new ImageWMS({
    url: 'https://smartcities.upvusig.car.upv.es/geoserver/taronja/wms',
    params: { 'LAYERS': 'taronja:total_w_param' },
    serverType: 'geoserver',
    crossOrigin: null,
});

const wmsLayer = new ImageLayer({
    source: wmsSource,
});

const manzanasSource = new ImageWMS({
    url: 'https://smartcities.upvusig.car.upv.es/geoserver/taronja/wms',
    params: { 'LAYERS': 'taronja:catastro_manzanas' },
    serverType: 'geoserver',
    crossOrigin: null,
});

const manzanasLayer = new ImageLayer({
    source: manzanasSource,
});

const osmLayer = new TileLayer({
    source: new OSM(),
})

const updateLegend = function (resolution) {
    const graphicUrl = wmsSource.getLegendUrl(resolution);
    const img = document.getElementById('legend');
    img.src = graphicUrl;
};

const view = new View({
    center: [-41939.925, 4789023.627],
    zoom: 12,
});

const map = new Map({
    layers: [osmLayer, wmsLayer, manzanasLayer],
    target: 'map',
    view: view,
});

// Initial legend
const resolution = map.getView().getResolution();
updateLegend(resolution);

// Update the legend when the resolution changes
map.getView().on('change:resolution', function (event) {
    const resolution = event.target.getResolution();
    updateLegend(resolution);
});

map.on('singleclick', function (evt) {
    document.getElementById('info').innerHTML = '';
    const viewResolution = /** @type {number} */ (view.getResolution());
    const url = wmsSource.getFeatureInfoUrl(
        evt.coordinate,
        viewResolution,
        'EPSG:3857',
        { 'INFO_FORMAT': 'text/html' }
    );
    if (url) {
        fetch(url)
            .then((response) => response.text())
            .then((html) => {
                document.getElementById('info').innerHTML = html;
            });
    }
});

map.on('pointermove', function (evt) {
    if (evt.dragging) {
        return;
    }
    const data = wmsLayer.getData(evt.pixel);
    const hit = data && data[3] > 0; // transparent pixels have zero for data[3]
    map.getTargetElement().style.cursor = hit ? 'pointer' : '';
});

function updateUrl(index) {
    wmsSource.updateParams({ 'LAYERS': urls[index] });
    map.getView().setCenter(centers[index])
    map.getView().setZoom(12)
}

const buttons = document.getElementsByClassName('switcher');

for (let i = 0, ii = buttons.length; i < ii; ++i) {
    const button = buttons[i];
    button.addEventListener('click', updateUrl.bind(null, Number(button.value)));
}


updateUrl(0);