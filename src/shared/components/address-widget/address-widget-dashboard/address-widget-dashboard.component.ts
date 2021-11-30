import { EventEmitter, Input } from '@angular/core';
import { Output } from '@angular/core';
import { Component, OnInit, ViewChild } from '@angular/core';
import { GooglePlaceDirective } from 'ngx-google-places-autocomplete';
import { Address } from 'ngx-google-places-autocomplete/objects/address';
import { AddressComponent } from 'ngx-google-places-autocomplete/objects/addressComponent';
import { LocationModel } from 'src/models/UxModel.model';
@Component({
  selector: 'app-address-widget-dashboard',
  templateUrl: './address-widget-dashboard.component.html',
  styleUrls: ['./address-widget-dashboard.component.scss']
})
export class AddressWidgetDashboardComponent implements OnInit {
  @ViewChild('places') places: GooglePlaceDirective;
  @Output() adressChangedEvent: EventEmitter<any> = new EventEmitter();
  @Input() addressLineHome: string;

  options = {
    types: [],
    componentRestrictions: { country: 'ZA' }
  }
  address: Address;
  x: AddressComponent;
  constructor() { }

  ngOnInit() {

  }

  userCurrentLocation() {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        const locationModel: LocationModel = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          addressLine: ``,
          url: ``
        }
        this.adressChangedEvent.emit(locationModel)
      });
    }
  }

  handleAddressChange(address: Address) {
    if (address && address.formatted_address) {
      this.address = address;
      const locationModel: LocationModel = {
        lat: this.address.geometry.location.lat(),
        lng: this.address.geometry.location.lng(),
        addressLine: this.address.formatted_address,
        url: this.address.url

      }
      this.adressChangedEvent.emit(locationModel)
    }
    this.x = this.getComponentByType(address, "street_number");
  }


  public getComponentByType(address: Address, type: string): AddressComponent {
    if (!type)
      return null;

    if (!address || !address.address_components || address.address_components.length == 0)
      return null;

    type = type.toLowerCase();

    for (let comp of address.address_components) {
      if (!comp.types || comp.types.length == 0)
        continue;

      if (comp.types.findIndex(x => x.toLowerCase() == type) > -1)
        return comp;
    }

    return null;
  }


}
