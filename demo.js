(function (win, doc) {

    class SimpleGeocoder {
        constructor(opts={}) {
            const defaults = {
                provider: 'osm',
                targetType: 'text-input',
                lang: 'en',
                placeholder: 'Search for ...',
                limit: 5,
                keepOpen: false,
            };
            let actual = Object.assign({}, defaults, opts);

            this._geocoder = new Geocoder('nominatim', actual);
            // console.log('this._geocoder:', this._geocoder);

            // dummy invisible olMap
            this._olMap = new ol.Map({
                target: document.createElement("div"), // dummy
                view: new ol.View({center: [0, 0], zoom: 3, minZoom: 2, maxZoom: 20}), // dummy
            });
            // console.log(this._olMap);

            // for addToMap()
            this._olMapExternal = null;
        }
        free() {
            console.log('free !!!!');
            this._olMap.removeControl(this._geocoder);
            if (this._olMapExternal) {
                this._olMapExternal.removeControl(this._geocoder);
            }
            this._geocoder = null;

            // https://stackoverflow.com/questions/25995334/deconstructing-an-open-layers-3-map
            this._olMap.setTarget(null);
            this._olMap = null;
        }
        onAddressChosen(cb) {
            this._geocoder.on('addresschosen', cb);
            return this;
        }
        addTo(target) {
            // disable position absolute for block rendering
            const con = this._geocoder.container;

            // $gcdcon.find('.gcd-gl-control').css({position: 'relative'});
            //----
            // SimpleGeocoder not depending on jquery
            let found = con.getElementsByClassName('gcd-gl-control');
            if (found.length > 0) {
                found[0].style.position = "relative";
            }

            con.style.top = "0";
            con.style.left = "0";
            con.style.position = "relative";

            this._olMap.addControl(this._geocoder);
            target.appendChild(con);
            return this;
        }
        addToMap(olMap) {
            this._olMapExternal = olMap;
            olMap.addControl(this._geocoder);
            return this;
        }
    }

    const $log = $('#log');
    const cb = (evt) => {
        console.log('evt:', evt);
        $log.empty();
        $log.append(`<p>GPS: ${evt.coordinate}</p>`);
        $log.append(`${evt.address.formatted}`);
    };


    let _sgc = null;
    let _olMap = null;
    const _onChangeMode = (value) => {
        console.log('value:', value);
        $log.empty();

        if (_sgc) {
            _sgc.free();
        }
        if (_olMap) {
            _olMap.setTarget(null);
            _olMap = null;
        }

        if (value.endsWith('olMap')) {
            _olMap = new ol.Map({
                target: document.getElementById('target'),
                view: new ol.View({center: [0, 0], zoom: 3, minZoom: 2, maxZoom: 20}),
                layers: [new ol.layer.Tile({source: new ol.source.OSM()})]
            });
            _sgc = new SimpleGeocoder({
                targetType: value.startsWith('box') ? 'text-input' : 'glass-button',
            }).addToMap(_olMap).onAddressChosen(cb);
        } else {
            _sgc = new SimpleGeocoder({
                targetType: value.startsWith('box') ? 'text-input' : 'glass-button',
            }).addTo(document.getElementById('target')).onAddressChosen(cb);
        }
    };


    class DemoGui extends DatGuiDefaults {
        // override
        initGui(gui, data, params) {
            let controller;

            let modeItems = ["box", "glass", "box in olMap", "glass in olMap"];
            controller = gui.add(params, 'mode', modeItems).name('Mode');
            controller.onChange((value) => {
                _onChangeMode(value);
                data.mode = value;
            });
        }
    }
    const guiData = { // with defaults
        mode: "box",
    };
    const dg = new DemoGui(guiData);
    dg.setDefaults({
        mode: guiData.mode,
    });

    _onChangeMode(guiData.mode); // first time

})(window, document);
