import _ from "lodash";
import map from 'lodash/map'
import React, { PropTypes, Component } from 'react';
import ReactDOM from "react-dom";

import Helmet from "react-helmet";
import PlacesAutocomplete from 'react-places-autocomplete'
var classNames = require('classnames');
import axios from  'axios';

import * as defaults from '../../constants/defaults';
import * as styles from '../../constants/styles';
import * as keys from '../../constants/keys';
import * as ac from '../../constants/autocomplete';

var react_update = require('react-addons-update');

import 
{
    withGoogleMap,
    GoogleMap,
    Marker,
    InfoWindow,
} from "react-google-maps";

export const GoogleMapStartUp = withGoogleMap(props => (
    <GoogleMap
        ref={props.onMapLoad}
        defaultZoom={3}
        options={{ minZoom: 3, maxZoom: 15 }}
        center={{ lat: defaults.CENTER_LAT, lng: defaults.CENTER_LONG }}>

        {
            props.markers.map(marker => (
                <Marker
                    { ...marker }
                    onRightClick={() => props.onMarkerRightClick(marker)}
                    onMouseOver={() => props.onMouseOver(marker)}>
                    {
                        marker.showInfo && (
                        <InfoWindow >
                            <div className="">
                                {
                                    marker.info ?
                                    <p>
                                        <b> {marker.info[0].user.firstName} says </b>
                                        { marker.info[0].text }
                                    </p>
                                    : null
                                }
                                <p>
                                    <b>Place </b>
                                    { marker.key }
                                </p>

                            </div>
                        </InfoWindow>
                    )}
                </Marker>

            ))
        }
    </GoogleMap>
));

export default class CheckinApp extends Component 
{
    constructor(props)
    {
        super(props);
        this.state = {
            activeMarker: {},
            selectedPlace: {},
            showingInfoWindow: true,
            markers: [{
              position: {
                lat: defaults.CENTER_LAT,
                lng: defaults.CENTER_LONG,
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

    getUrl() 
    {
        let clientID = keys.CLIENT_ID;
        let clientSecret = keys.CLIENT_SECRET;
        let version = keys.VERSION;

        let location = this.state.address;
        let url = keys.BASE_URL + clientID + '&client_secret=' + clientSecret + '&near=' + location + '&' + version;
        return url;
    }

    handleFormSubmit(event)
    {
        event.preventDefault();
        this.searchNearPlaces();
    }

    handleMapLoad(map) 
    {
        this._mapComponent = map;
    }

    handleMarkerRightClick(targetMarker) 
    {

        const nextMarkers = this.state.markers.filter(marker => marker !== targetMarker);
        this.setState({
          markers: nextMarkers,
        });

        var bounds = new google.maps.LatLngBounds();
        this.state.markers.map((marker, i) => {
         bounds.extend(marker.position);
        })

        this._mapComponent.fitBounds(bounds);
    }

    searchNearPlaces() 
    {
        let url = this.getUrl();
        
        axios.get(url)
            .then(response => {
                let results = response.data.response.groups[0].items;
                this.setState({ results:results });
                this.setState({ markers: [] })
                var bounds = new google.maps.LatLngBounds();

                results.map((el, i) => {

                    if (i < 20 ) {
                        const nextMarkers = [
                        ...this.state.markers,
                            {
                                position: { lat: el.venue.location.lat, lng: el.venue.location.lng  },
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

            var index_val = 0;
            var update = {};
            update[index_val] = { $merge: {showInfo: true } };

            var changedMarkers = react_update(this.state.markers, update);
            this.setState({ markers: changedMarkers });

            this.state.markers.map((marker, i) => {
                bounds.extend(this.state.markers[i].position);
            })

            this._mapComponent.fitBounds(bounds);

            }).catch(error => console.error('Error', error))
    }

    handleOnMouseMarker(targetMarker)
    {
        console.log("TM ", targetMarker);        
        var index_val = this.state.markers.findIndex(m => m.position == targetMarker.position)
        var update = {};
        var bounds = new google.maps.LatLngBounds();

        if(targetMarker.showInfo)
        {
        }
        else
        {
            update[index_val] = { $merge: {showInfo: true } };

            var changedMarkers = react_update(this.state.markers, update);
            this.setState({ markers: changedMarkers });
            var info = this.state.markers.filter(m => m.showInfo == true)

            this.state.markers.map((marker, i) => {
                bounds.extend(this.state.markers[i].position);
            })

            this._mapComponent.fitBounds(bounds);

            setTimeout(() => {
                this.handleOnMouseOutMarker(targetMarker)}, info.length*50000);
            }

    }

    handleOnMouseOutMarker(targetMarker)
    {
        var index_val = this.state.markers.findIndex(m => m.position == targetMarker.position)
        var update = {};
        var bounds = new google.maps.LatLngBounds();
        if (index_val != -1) 
        {
            update[index_val] = {
                $merge: { showInfo: false }
            };
            var changedMarkers = react_update(this.state.markers, update);
            this.setState({ markers: changedMarkers });
        }

        this.state.markers.map((marker, i) => {
            bounds.extend(this.state.markers[i].position);
            })
        this._mapComponent.fitBounds(bounds);
        console.log("bounds", bounds )
    }

    render() 
    {
        const inputProps = {
            value: this.state.address,
            onChange: this.onChange,
            type: 'search',
            placeholder: 'Search Places...',
            autoFocus: true,
        }

        const cssClasses = styles.CSS_CLASSES;
        const myStyles = styles.MAP_STYLES;

        const AutoCompleteItem = ac.AutoCompleteItem;

        return (
            <div ref="map" style={{height: '600px'}}>
                <Helmet title="GoogleMap"/>

                <form onSubmit={this.handleFormSubmit.bind(this)}>
                    <PlacesAutocomplete
                        inputProps={inputProps}
                        classNames={cssClasses}
                        styles={myStyles}
                        autocompleteItem={AutoCompleteItem}
                         />
                         <button type="submit">Submit</button>
                </form>

                <GoogleMapStartUp
                  containerElement={ <div style={{ height: '650px' }} /> }

                  mapElement={ <div style={{ height: '650px' }} /> }

                  onMapLoad={ this.handleMapLoad.bind(this) }

                  markers={ this.state.markers }

                  onMouseOver={ this.handleOnMouseMarker.bind(this) }

                  onMarkerRightClick={ this.handleMarkerRightClick.bind(this) }
                />
            </div>
        );
    }
}

window.initMap = () => {
    ReactDOM.render(
        <CheckinApp />,
    document.getElementById('root')
    )
}