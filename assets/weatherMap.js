var WeatherMap = {
	chartWidth: 400,
	chartBarWidth: 2,
        openWeatherMapKey: 'f9e857b9d3169a62f9ef93f8e9ffc2c0'
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
	componentDidMount: function(){
		this.hashChange();
		var self = this;
		window.onhashchange = function(){
			self.hashChange();
		};
	},
	componentDidUpdate: function(){
                // add some state into localStorage
		localStorage['weatherMap:coords'] = this.state.coords;
	},
	hashChange: function(){
                // handle hashChange 
                var hash = location.hash.slice(1);
		if (!hash) return;
	},
        render: function(){
		return (
			React.createElement("div", null, 
				React.createElement(Map, null), 
				React.createElement("div", {id: "sidebar"}, 
					React.createElement("header", null, 
						React.createElement("h1", null, React.createElement(Icon, {type: "mountains", width: "24", height: "24"}), " Weather Map")
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
	componentDidMount: function(){
		var node = this.getDOMNode();
                var map = new google.maps.Map(node, this.props.mapOption);
                var state = this.state
                var self = this
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
        console.log(map.getBounds());
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

            // Take the JSON results and proccess them
            var processResults = function(response) {
                var results = response.data
                console.log(results);
                if (results.list.length > 0) {
                    resetData();
                    for (var i = 0; i < results.list.length; i++) {
                        geoJSON.features.push(jsonToGeoJson(results.list[i]));
                    }
                    drawIcons(geoJSON);
                }
            };
            var jsonToGeoJson = function (weatherItem) {
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
            };
            // Add the markers to the map
            var drawIcons = function (weather) {
                map.data.addGeoJson(geoJSON);
                // Set the flag to finished
                self.setState({
                    gettingData: false
                })
            };
            // Clear data layer and geoJSON
            var resetData = function () {
                geoJSON = {
                    type: "FeatureCollection",
                    features: []
                };
                map.data.forEach(function(feature) {
                    map.data.remove(feature);
                });
            };

            self.serverRequest = 
                axios.get(requestString)
                .then(processResults);
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

var LocationForm = React.createClass({displayName: "LocationForm",
	render: function(){
		return (
			React.createElement("form", {id: "directions-form", onSubmit: this.handleSubmit}, 
				React.createElement("div", {className: "field-section"}, 
					React.createElement("label", null, 
						React.createElement("select", {ref: "travelMode", onChange: this.handleTravelModeChange}, 
							React.createElement("option", {value: "walking"}, "Walking"), 
							React.createElement("option", {value: "bicycling"}, "Bicycling"), 
							React.createElement("option", {value: "driving"}, "Driving")
						), " from"
					), 
					React.createElement("input", {ref: "start", id: "directions-start", placeholder: "Start", required: true})
				), 
				React.createElement("a", {href: "#", id: "flip-direction", onClick: this.handleFlip, title: "Flip origin and destination", tabIndex: "-1"}, React.createElement(Icon, {type: "arrow-right", width: "14", height: "14"})), 
				React.createElement("div", {className: "field-section"}, 
					React.createElement("label", {htmlFor: "directions-end"}, "To"), 
					React.createElement("input", {ref: "end", id: "directions-end", placeholder: "Destination", required: true})
				), 
				React.createElement("div", {className: "form-footer"}, 
					React.createElement("div", {className: "options"}, 
						React.createElement(Icon, {type: "widget", width: "20", height: "20", title: "Settings"}), 
						React.createElement("span", null, 
							React.createElement("label", null, "Distance ", 
								React.createElement("select", {ref: "distanceSelect", value: units.distance, onChange: this.handleDistanceChange}, 
									React.createElement("option", {value: "km"}, "km"), 
									React.createElement("option", {value: "miles"}, "miles")
								)
							), " ", 
							React.createElement("label", null, "Height ", 
								React.createElement("select", {ref: "heightSelect", value: units.height, onChange: this.handleHeightChange}, 
									React.createElement("option", {value: "m"}, "m"), 
									React.createElement("option", {value: "ft"}, "ft")
								)
							)
						)
					), 
					React.createElement("button", null, "Go")
				)
			)
		);
	}
});

React.renderComponent(
	React.createElement(App, null),
	document.getElementById('app')
);
