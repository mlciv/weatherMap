var WeatherMap = {
	chartWidth: 400,
	chartBarWidth: 2,
        openWeatherMapKey: 'f9e857b9d3169a62f9ef93f8e9ffc2c0',
        dbipAPIKey: '4342b1ec2999af4b9168d681aea19c12bb4fcc8e'
};
var infowindow = new google.maps.InfoWindow();

var App = React.createClass({displayName: "App",
        // Invoked once before the component is mounted. The return value will
        // be used as the initial value of this.stateInvoked once before the
        // component is mounted. The return value will be used as the initial
        // value of this.stateInvoked once before the component is mounted. The
        // return value will be used as the initial value of this.state
	getInitialState: function(){
		return {
                    //add init state
                    coords : localStorage['weatherMap:coords'],
		};
	},
	componentDidUpdate: function(){
                // add some state into localStorage
		localStorage['weatherMap:coords'] = this.state.coords;
	},
        render: function(){
		return (
			React.createElement("div", null, 
				React.createElement(Map, null), 
				React.createElement("div", {id: "sidebar"}, 
					React.createElement("header", null, 
						React.createElement("h1", null, React.createElement(Icon, {type: "mountains", width: "24", height: "24"}), " Weather Map"), 
					React.createElement(IPForm, null)
					)
				)
			)
		);
	}
});

//TODO: change a weather icon
var Icon = React.createClass({displayName: "Icon",
	render: function(){
		var type = this.props.type;
		var title = this.props.title;
		return (
			React.createElement("svg", {title: title, className: "icon", dangerouslySetInnerHTML: {__html: '<use xlink:href="assets/icons.svg#icon-' + type + '"></use>'}, width: this.props.width, height: this.props.height})
		);
	}
});

var Map = React.createClass({displayName: "Map",
	getInitialState: function(){
		return {
                    //add init state
                    cityName : 'Wuhan',
                    countryCode :'cn',
                    gettingData : false
		};
	},
	getDefaultProps: function(){
		return {
			mapOption: {
				center: new google.maps.LatLng(40.7608, -111.8910),
				zoom: 12,
				disableDefaultUI: true
			}
		};
	},
	statics: {
		pinpointMarker: new google.maps.Marker({
			visible: false,
			clickable: false,
			zIndex: 1000
		}),
		showPinpointMarker: function(location){
			this.pinpointMarker.setPosition(location);
			this.pinpointMarker.setVisible(true);
		},
		hidePinpointMarker: function(){
			this.pinpointMarker.setVisible(false);
		}
	},
	hashChange: function(map){
                // handle hashChange 
                var hash = location.hash.slice(1);
		if (!hash) return;
                var values = hash.split('/');
                var cityName = decodeURIComponent(values[0]);
                var countryCode = decodeURIComponent(values[1]);
                this.setState({
                    cityName : cityName,
                    countryCode : countryCode
                }
                );
                this.getWeatherByCityName(map)
	},
	componentDidMount: function(){
		var node = this.getDOMNode();
                var map = new google.maps.Map(node, this.props.mapOption);
                var state = this.state;
                var self = this;
                this.hashChange(map);
		window.onhashchange = function(){
			self.hashChange(map);
		};
                var checkIfDataRequested = function() {
                    // Stop extra requests being sent
                    while (state.gettingData === true) {
                        self.serverRequest.abort();
                        setState({
                            gettingData : false
                        });
                    }
                    self.getCoords(map);
                };
                map.addListener('idle', checkIfDataRequested);
                // Sets up and populates the info window with details
                    map.data.addListener('click', function(event) {
                        infowindow.setContent(
                                "<img src=" + event.feature.getProperty("icon") + ">"
                                + "<br /><strong>" + event.feature.getProperty("city") + "</strong>"
                                + "<br />" + event.feature.getProperty("temperature") + "&deg;C"
                                + "<br />" + event.feature.getProperty("weather")
                                );
                        infowindow.setOptions({
                            position:{
                                lat: event.latLng.lat(),
                                lng: event.latLng.lng()
                            },
                            pixelOffset: {
                                width: 0,
                                height: -15
                            }
                        });
                        infowindow.open(map);
                    });
        Map.pinpointMarker.setMap(map);
},
    getCoords : function(map) {
        console.log('bounds' + map.getBounds());
        var bounds = map.getBounds();
        var NE = bounds.getNorthEast();
        var SW = bounds.getSouthWest();
        this.setState({
            neLat: NE.lat(),
            neLng: NE.lng(),
            swLat: SW.lat(),
            swLng: SW.lng()
        });
        this.getWeathers(map)
    },
    // Take the JSON results and process them
    processResults : function(map, response) {
        var results = response.data
        console.log('weatherResults'+results);
        console.log(results);
        if (typeof results.list != 'undefined'){
            if (results.list.length > 0) {
                this.resetData(map);
                for (var i = 0; i < results.list.length; i++) {
                    geoJSON.features.push(this.jsonToGeoJson(map, results.list[i]));
                }
                this.drawIcons(map, geoJSON);
            }
        }else{
            this.resetData(map);
            var feature = this.jsonToGeoJson(map, results);
            geoJSON.features.push(feature);
            var center = new google.maps.LatLng(results.coord.lat, results.coord.lon);
            map.setCenter(center);
            this.drawIcons(map,geoJSON);
        }
    },

    jsonToGeoJson : function (map, weatherItem) {
        var feature = {
            type: "Feature",
            properties: {
                city: weatherItem.name,
                weather: weatherItem.weather[0].main,
                temperature: weatherItem.main.temp,
                min: weatherItem.main.temp_min,
                max: weatherItem.main.temp_max,
                humidity: weatherItem.main.humidity,
                pressure: weatherItem.main.pressure,
                windSpeed: weatherItem.wind.speed,
                windDegrees: weatherItem.wind.deg,
                windGust: weatherItem.wind.gust,
                icon: "http://openweathermap.org/img/w/"
                    + weatherItem.weather[0].icon  + ".png",
                coordinates: [weatherItem.coord.lon, weatherItem.coord.lat]
            },
            geometry: {
                type: "Point",
                coordinates: [weatherItem.coord.lon, weatherItem.coord.lat]
            }
        };
        // Set the custom marker icon
        map.data.setStyle(function(feature) {
            return {
                icon: {
                    url: feature.getProperty('icon'),
                    anchor: new google.maps.Point(25, 25)
                }
            };
        });

        // returns object
        return feature;
    },
    // Add the markers to the map
    drawIcons : function (map, weather) {
        map.data.addGeoJson(geoJSON);
        // Set the flag to finished
        this.setState({
            gettingData: false
        })
    },
    // Clear data layer and geoJSON
    resetData : function (map) {
        geoJSON = {
            type: "FeatureCollection",
            features: []
        };

        map.data.forEach(function(feature) {
            map.data.remove(feature);
        });
    },
    getWeatherByCityName : function(map){
        var self = this;
        this.setState({
            gettingData: true
        });
        var state = this.state;
        var cityName = state.cityName;
        var countryCode = state.countryCode;
        var requestString = "http://api.openweathermap.org/data/2.5/weather?q="
                + cityName + "," + countryCode
                + "&APPID=" + WeatherMap.openWeatherMapKey;
        console.log(requestString);
        self.serverRequest = 
                axios.get(requestString)
                .then(function(response) {
                    self.processResults(map, response)
                });
    },
    getWeathers: function(map){
            var self = this;
            this.setState({
                gettingData: true
            });
            var state = this.state;
            var northLat = state.neLat;
            var eastLng = state.neLng;
            var southLat = state.swLat;
            var westLng = state.swLng;
            var requestString = "http://api.openweathermap.org/data/2.5/box/city?bbox="
                + westLng + "," + northLat + "," //left top
                + eastLng + "," + southLat + "," //right bottom
                + map.getZoom()
                + "&cluster=yes&format=json"
                + "&APPID=" + WeatherMap.openWeatherMapKey;
            self.serverRequest = 
                axios.get(requestString)
                .then(function(response) {
                    self.processResults(map, response)
                });
        },
        componentWillUnmount: function() {
            this.serverRequest.abort();
        },
	render: function(){
		return (
			React.createElement("div", {id: "map-canvas"})
		);
	}
});

var Chart = React.createClass({displayName: "Chart",
	handleBarMouseEnter: function(index){
		this.props.onBarMouseEnter(index);
	},
	handleBarMouseLeave: function(){
		this.props.onBarMouseLeave();
	},
	render: function(){
		var self = this;
		var props = this.props;
		var chartStyle = {
			width: props.width,
			height: 0 // initially zero height
		};
		var bars = '';
		if (props.data){
			bars = props.data.map(function(d, i){
				var style = {
					borderBottomWidth: props.height * d.value / props.domain[1]
				};
				var key = i + '-' + d.value;
				return (
					React.createElement("div", {style: style, key: key, onMouseEnter: self.handleBarMouseEnter.bind(self, i), onMouseLeave: self.handleBarMouseLeave}, React.createElement("span", null, d.title))
				);
			});
			chartStyle.height = props.height; // then grow the height, CSS transition applied here
		}
		return (
			React.createElement("div", {className: "chart", style: chartStyle}, 
				bars
			)
		)
	}
});

// a form to submit a ip address to Map
var IPForm = React.createClass({displayName: "IPForm",
        handleSubmit : function() {
          var ipAddress = this.refs.ip_address.getDOMNode().value.trim();  
          this.updateLocationHash(ipAddress);
          console.log(ipAddress);
        },
    processResults: function(response) {
        var jsonp = response.data+'';
        if(!jsonp) return; 
        var json = jsonp.substring(jsonp.indexOf("(") + 1, jsonp.length-2);
        console.log(json)
        var results = JSON.parse(json)
        console.log(results);
        var cityName = results.city
        var countryCode = results.country
        location.hash = encodeURIComponent(cityName)+'/'+encodeURIComponent(countryCode);
        console.log(location.hash);
    },
    updateLocationHash : function(ipAddress) {
        //get city name
        var self = this;
        var requestString = "http://ipinfo.io/" + ipAddress +"/geo?callback=HANDLECALLBACK";
        console.log(requestString);
        axios.get(requestString)
            .then(function(response) {
                self.processResults( response)
            });
    },
    render: function(){
		return (
				React.createElement("div", {className: "field-section"}, 
					React.createElement("label", {htmlFor: "IPAddress"}, "IP Address"), 
					React.createElement("input", {ref: "ip_address", id: "ip_address", placeholder: "IP Address", required: true}), 
                                        React.createElement("input", {type: "button", onClick: this.handleSubmit, value: "Show Weather"})
				)
		);
	}
});

React.renderComponent(
	React.createElement(App, null),
	document.getElementById('app')
);
