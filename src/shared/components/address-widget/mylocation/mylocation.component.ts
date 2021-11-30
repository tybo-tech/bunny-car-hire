import { EventEmitter } from '@angular/core';
import { Output } from '@angular/core';
import { Component, OnInit, ViewChild } from '@angular/core';
import { GooglePlaceDirective } from 'ngx-google-places-autocomplete';
import { Address } from 'ngx-google-places-autocomplete/objects/address';
import { AddressComponent } from 'ngx-google-places-autocomplete/objects/addressComponent';
import { } from 'googlemaps';
import { LocationModel } from 'src/models/UxModel.model';
import { MouseEvent } from '@agm/core';
import { CompanyService } from 'src/services/company.service';
import { User } from 'src/models';
import { AccountService, UserService } from 'src/services';

@Component({
  selector: 'app-mylocation',
  templateUrl: './mylocation.component.html',
  styleUrls: ['./mylocation.component.scss']
})
export class MylocationComponent implements OnInit {
  @ViewChild('places') places: GooglePlaceDirective;
  @Output() adressChangedEvent: EventEmitter<any> = new EventEmitter();

  options = {
    types: [],
    componentRestrictions: { country: 'ZA' }
  }
  address: Address;
  x: AddressComponent;
  addressLineHome: string;
  locationModel: LocationModel;
  zoom = 16;
  draggable = true;
  user: User;

  icon = `https://instanteats.co.za/assets/images/biker.svg`;

  constructor(private companyService: CompanyService
    , private accountService: AccountService, private userService: UserService
  ) { }

  ngOnInit() {
    this.userCurrentLocation();
    this.user = this.accountService.currentUserValue;

  }

  userCurrentLocation() {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        console.log(position);

        this.locationModel = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          addressLine: ``,
          url: ``
        }


        this.companyService.getAddress(this.locationModel.lat, this.locationModel.lng).subscribe(data => {
          if (data && data.results && data.results[0]) {
            this.addressLineHome = data.results[0].formatted_address
            this.locationModel.addressLine = this.addressLineHome;
            this.user.Latitude = this.locationModel.lat;
            this.user.Longitude = this.locationModel.lng;
            this.user.AddressLineHome = this.addressLineHome;
            this.userService.updateUserSync(this.user).subscribe(user => {
              this.accountService.updateUserState(this.user);
            })
          }
        });
      });
    }
  }

  handleAddressChange(address: Address) {
    if (address && address.formatted_address) {
      this.address = address;
      console.log(address);
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
  markerDragEnd(position: MouseEvent) {
    console.log('dragEnd', position);
    this.locationModel = {
      lat: position.coords.lat,
      lng: position.coords.lng,
      addressLine: ``,
      url: ``
    }


    this.companyService.getAddress(this.locationModel.lat, this.locationModel.lng).subscribe(data => {
      if (data && data.results && data.results[0]) {
        this.addressLineHome = data.results[0].formatted_address
        this.locationModel.addressLine = this.addressLineHome;
        this.user.Latitude = this.locationModel.lat;
        this.user.Longitude = this.locationModel.lng;
        this.user.AddressLineHome = this.addressLineHome;
        this.userService.updateUserSync(this.user).subscribe(user => {
          this.accountService.updateUserState(this.user);
        })
      }
    });
  }

  onAdressEvent(event: LocationModel) {
    this.adressChangedEvent.emit(event)
  }
}
