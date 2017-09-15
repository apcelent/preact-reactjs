Title: Migrating a realtime Checkins Discovery App from React to Preact

Date: 2017-08-11 00:00

Tags: reactjs, foursquare, googlemaps, preact, realtime

Published: August 11 2017

Slug: migrating-a-relatime-checkins-discovery-app-react-preact

In this post we are going to create a client side web application to render FourSquare Checkins of a specified location 
per user's preference in realtime. The major technologies we are going to use is ReactJS, FourSquare API, Google Maps API. 

And later down the tutorial we will see how to migrate a pre-written react app to a preact app. 

![](images/checkins.png)
 
### Overview

React-Checkins is a realtime checkins discovery app built using Google Maps API with ReactJS.

### Setup and Maps Integration

We will use npm for managing all our code dependencies. First let’s setup npm in the root of our project. This will generate a file called `package.json` in project root.
If you use the --save or --save-dev flag when installing a package, it’ll save the packages as dependencies in the package.json file.
To reinstall the packages, all we need to is run npm install. The packages will be installed locally specific to our project under a directory called node_modules like virtualenv.

So, let’s generate a package.json file in our project root using npm init.
  
    npm init

Let’s install our first npm packages.

  npm install --save react webpack babel babel-loader webpack-dev-server react-google-maps react-addons-update classnames

package.json contains several other dependencies. 

npm should install the dependencies under the node_modules folder structure by default.

### Create webpack config

Let us now create a webpack config. The goal of creating the config file is to concatenate all the js files. 

    mkdir -p src/js
    touch webpack.config.js
    touch dev/js/components/GoogleApp.js
    
Let’s create a simple webpack config to load .jsx files using babel and [More on webpack configuration here](http://webpack.github.io/docs/configuration.html).

webpack.config file
  
    var path = require('path');
    var webpack = require('webpack');

    module.exports = {
        devServer: {
            inline: true,
            contentBase: './src',
            port: 3000
        },
        devtool: 'cheap-module-eval-source-map',
        entry: './dev/js/components/GoogleApp.js', ///entry point of our app. 
        module: {
            loaders: [
                {
                    test: /\.js$/,
                    loaders: ['babel'],
                    exclude: /node_modules/
                },
                {
                    test: /\.scss/,
                    loader: 'style-loader!css-loader!sass-loader'
                }
            ]
        },
        output: {
            path: 'src',
            filename: 'js/bundle.min.js'
        },
        plugins: [
            new webpack.optimize.OccurrenceOrderPlugin()
        ]
    };
    
At this point, our directory structure will look something like this.
  
    root
      |-- dev
        | |--js
        |     |--components
        |         |--GoogleApp.js
        |-- node_modules
        |-- src
        | |-- js
        |   | |-- bundle.min.js   ## will create after run npm start
        |   |-- index.html
        |-- webpack.config.js
        |-- package.json
        |-- .babelrc

The index file looks as below and can be found here 

![image]({filename}/images/html.png)

#### Initializing Maps in React Component

    import {
        withGoogleMap,
        GoogleMap,
        Marker,
        InfoWindow,
} from "react-google-maps";
    
If you're going to be loading the map through your index.html file you can include the below.

     <script src="https://maps.googleapis.com/maps/api/js?key=GOOGLE_API_KEY&callback=initMap&libraries=places"async defer></script>
    
##### Dynamically retrieving the Google Maps Library

      const GettingStartedGoogleMap = withGoogleMap(props => (
          <GoogleMap
          ref={props.onMapLoad}
          defaultZoom={3}
          options={{ minZoom: 3, maxZoom: 15 }}
          center={{ lat: 20.5937, lng: 78.9629 }}
          >
          {props.markers.map(marker => (
            <Marker
              {...marker}
              onRightClick={() => props.onMarkerRightClick(marker)}
              onMouseOver={() => props.onMouseOver(marker)}
              >
              {marker.showInfo && (
                <InfoWindow >
                  <div className="">
                  {marker.info ?
                  <p><b>{marker.info[0].user.firstName} says </b>
                      {marker.info[0].text}</p>
                  : null}
                  <p><b>Place </b> {marker.key}</p>
    
                  </div>
                </InfoWindow>
              )}
    
            </Marker>
    
          ))}
          </GoogleMap>
    ));
    
     // initial state of markers

    constructor(props)
            {
                super(props);
                this.state = {
                    markers: [{
                      position: {
                        lat: null,
                        lng: null,
                      },
                      key: null,
                      defaultAnimation: null,
                      showInfo:false,
                      info: []
                    }],
                    address: '',
                    results: []
                  };
                  this.onChange = (address) => this.setState({ address })
            }

### Search the places through the foursqaure

The searchNearPlaces function takes the response from the city search query and pushes
all the results inside an array object with their respective [lat, lng] co-ordinates and pin’s icon link.

      getUrl() {
            const clientID = YOUR_FOURSQUARE_CLIENT_ID,
                  clientSecret = YOUR_FOURSQUARE_CLIENT_SECRET,
                  version = 'v=20140806';
            let location = this.state.address,
            url = 'https://api.foursquare.com/v2/venues/explore?client_id=' + 
              clientID + '&client_secret=' + clientSecret + '&near=' + 
                location + '&' + version;
            return url;
        }
    
        searchNearPlaces() {
            let url = this.getUrl();
            axios.get(url)
                .then(response => {
                    let results = response.data.response.groups[0].items;
                    this.setState({ results:results });
                    // Do with results
                    
                 })
         }
      
  Let's save the first 20 out of total results as markers.

      var bounds = new google.maps.LatLngBounds();
      results.map((el, i) => {
            if (i < 20 ) {
            const nextMarkers = [
            ...this.state.markers,
            {
            position: { 
                lat: el.venue.location.lat, 
                lng: el.venue.location.lng  },
            defaultAnimation: 2,
            key: el.venue.name,
            showInfo: false,
            info: el.tips
            },
            ];
            this.setState({
            markers: nextMarkers,
            })
    
          bounds.extend(this.state.markers[i].position);
          }

        })
        this._mapComponent.fitBounds(bounds);   // bound the all markers of map
  
And now we render the component 

      render() {
            const inputProps = {
                value: this.state.address,
                onChange: this.onChange,
                type: 'search',
                placeholder: 'Search Places...',
                autoFocus: true,
            }
            const cssClasses = {
                root: 'form-group',
                input: 'form-control',
                autocompleteContainer: 'my-autocomplete-container'
            }
            const myStyles = {
                root: { position: 'absolute' },
                input: { width: '100%' },
                autocompleteContainer: { backgroundColor: 'green' },
                autocompleteItem: { color: 'black' },
                autocompleteItemActive: { color: 'blue' }
            }
    
            const AutocompleteItem = ({ suggestion }) => (<div>
              <i className="fa fa-map-marker"/>{suggestion}</div>)
            return (
                <div ref="map" style={{height: '600px'}}>
                    <Helmet
                      title="GoogleMap"
                    />
                    <form onSubmit={this.handleFormSubmit.bind(this)}>
                        <PlacesAutocomplete
                            inputProps={inputProps}
                            classNames={cssClasses}
                            styles={myStyles}
                            autocompleteItem={AutocompleteItem}
                             />
                             <button type="submit">Submit</button>
                    </form>
    
                    <GettingStartedGoogleMap
                      containerElement={
                        <div style={{ height: '650px' }} />
                      }
                      mapElement={
                        <div style={{ height: '650px' }} />
                      }
                      onMapLoad={this.handleMapLoad.bind(this)}
                      markers={this.state.markers}
                      onMouseOver={this.handleOnMouseMarker.bind(this)}
    
                      onMarkerRightClick={this.handleMarkerRightClick.bind(this)}
                    />
                </div>
            );
        }
        /// google maps loaded with support of initMap
        window.initMap = () => {
        ReactDOM.render(
            <GettingStartedExample />,
        document.getElementById('root')
        )
      }

We will now add a funcationality to show the info of a marker on mouse hover

  
       var react_update = require('react-addons-update');
    
       update[index_val] = {
         $merge: {showInfo: false}
        };
        var changedMarkers = react_update(this.state.markers, update);
        this.setState({ markers: changedMarkers });




# Replacing ReactJS with PreactJS

Recently Facebook modified the license of ReactJS from BSD to BSD+patents license. 
Addition of patents clause means that if it felt that the product using ReactJS is competing with facebook,
it's license will be revoked. So, we started looking for alternatives of ReacJS which would work seamlessly
with existing react application. Preact is one such solution.

Preact is a lightweight javascript library (3 kb) which can be used as a replacement for [Reactjs](https://facebook.github.io/react/).

### Installation

[preact-compat](https://github.com/developit/preact-compat) is another layer on top of 
preact which allows us to switch from react to preact without much changes to the existing code.

First, install preact and preact-compat modules

    npm i --save preact
    npm i --save preact-compat


To use preact with webpack, we add an alias for react and react-dom in webpack.config.js file


    resolve: {
            extensions: ['', '.js', '.jsx'],
            "alias": {
                "react": "preact-compat",
                "react-dom": "preact-compat"
            }
        },


In the example, a simple [react hello world application](https://github.com/vibhash1083/react-map-checkins/tree/preact) has been created. It has one component HelloWorld.js


    import React, { Component } from 'react';
    import ReactDOM from "react-dom";
    
    export default class HelloWorld extends Component {
        constructor(props) 
        {
            super(props);
        }
    
      render()
      {
    
        return (
              <div>
              <h1>
                Hello World!
                </h1>
              </div>
        );
      }
    }
    
    ReactDOM.render(
        <HelloWorld />,
        document.getElementById('root')
    )


Once the webpack.config.js file is updated to add alias of preact and preact-compat, application works in same way as preact-compat provides same exports as react and react-dom.


    var path = require('path');
    var webpack = require('webpack');
    
    module.exports = {
        devServer: {
            inline: true,
            contentBase: './src',
            port: 3000
        },
        devtool: 'cheap-module-eval-source-map',
        entry: './dev/js/components/HelloWorld.js',
        module: {
            loaders: [
                {
                    test: /\.js$/,
                    loaders: ['babel'],
                    exclude: /node_modules/
                },
                {
                    test: /\.scss/,
                    loader: 'style-loader!css-loader!sass-loader'
                }
            ]
        },
        output: {
            path: 'src',
            filename: 'js/bundle.min.js'
        },
        resolve: {
            extensions: ['', '.js', '.jsx'],
            "alias": {
                "react": "preact-compat",
                "react-dom": "preact-compat"
            }
        },
        plugins: [
            new webpack.optimize.OccurrenceOrderPlugin()
        ]
    };
    

We used same configuration changes to react map checkin application and the checkin discovery works as before.

#### Conclusion

It is a working React-Checkins app providing a fair understanding of how we can integrate Google Maps with ReactJS — all in less than 15 minutes.
For reference, the entire code is [here](https://github.com/vibhash1083/react-map-checkins).
