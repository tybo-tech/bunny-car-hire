import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Address } from 'ngx-google-places-autocomplete/objects/address';
import { GooglePlaceDirective } from 'ngx-google-places-autocomplete';
import { AddressComponent } from 'ngx-google-places-autocomplete/objects/addressComponent';
import { timer } from 'rxjs';
import { OrderService } from 'src/services';
import { Order } from 'src/models';
import { COMPANYID, ORDER_TYPE_SALES } from 'src/shared/constants';

@Component({
  selector: 'app-home-slider',
  templateUrl: './home-slider.component.html',
  styleUrls: ['./home-slider.component.scss']
})
export class HomeSliderComponent implements OnInit {
  @ViewChild('places') places: GooglePlaceDirective;
  addressLine: string;
  options = {
    types: [],
    componentRestrictions: { country: 'ZA' }
  }
  address: Address;
  x: AddressComponent;
  slide = 0;
  maxSlideNumber: number;
  thisClass: string;
  size = 1000;
  $timer: any;
  order: Order;
  constructor(
    private router: Router, private orderService : OrderService
  ) { }

  ngOnInit() {
    window.scroll(0, 0)


    this.$timer = timer(500, 6000);
    this.$timer.subscribe(data => {
      this.slideNext();
    })


    this.order = this.orderService.currentOrderValue;
      if (!this.order) {
        this.order = {
          OrdersId: '',
          OrderNo: 'Shop',
          CompanyId: COMPANYID,
          Company: null,
          CustomerId: '',
          AddressId: '',
          Notes: '',
          OrderType: ORDER_TYPE_SALES,
          Total: 0,
          Paid: 0,
          Due: 0,
          InvoiceDate: new Date(),
          DueDate: '',
          CreateUserId: 'shop',
          ModifyUserId: 'shop',
          Status: 'Not paid',
          StatusId: 1,
          Orderproducts: []
        }
        this.orderService.updateOrderState(this.order);
      }
  }

  orderChanged() {
    console.log(this.order);
    
    this.orderService.updateOrderState(this.order);
  }

  changeSlide(i: number) {
    if ((this.slide + i) > this.maxSlideNumber) {
      this.slide = 1;
      return;
    }
    if ((this.slide + i) < 1) {
      this.slide = this.maxSlideNumber;
      return;
    }
    this.slide += i;

    if (i == 1) {
      this.thisClass = 'rigth';
    }
    if (i == -1) {
      this.thisClass = 'left';
    }
  }

  slideNext() {
    // this.$timer = timer(1000, 4000);
    const carousel: any = document.querySelector('.carousel-slide');
    const images: any = document.querySelectorAll('.carousel-slide img');

    if (images && images.length && images[this.slide]) {
      this.size = images[this.slide].clientWidth;
    }

    if (this.slide === 2) {
      this.slide = 0;
      if (images[this.slide]) {
        this.size = images[this.slide].clientWidth;
      }
      carousel.style.transform = `translateX(${(-this.size * this.slide)}px)`;
      return
    }

    if (carousel) {
      this.slide++;
      carousel.style.transition = "transform 0.6s ease-in-out";
      carousel.style.transform = `translateX(${(-this.size * this.slide)}px)`;

    }

  }

  slidePrev() {
    this.$timer = timer(1000, 4000);
    const carousel: any = document.querySelector('.carousel-slide');
    const images: any = document.querySelectorAll('.carousel-slide img');
    if (images && images.length && images[this.slide]) {
      this.size = images[this.slide].clientWidth;
    }
    if (this.slide === 0) {
      this.slide = images.length - 1;
      carousel.style.transition = "transform 0.6s ease-in-out";
      carousel.style.transform = `translateX(${(-this.size * this.slide)}px)`;
      return;
    }

    if (carousel) {
      this.slide--;
      carousel.style.transition = "transform 0.6s ease-in-out";
      carousel.style.transform = `translateX(${(-this.size * this.slide)}px)`;
    }
  }

  selectCategory(category: string) {
    this.router.navigate([`collections/${category}`])
  }
  goto(url) {
    this.router.navigate([url])
  }


  handleAddressChange(address: Address) {
    if (address && address.formatted_address) {
      this.address = address;
      const locationModel: any = {
        lat: this.address.geometry.location.lat(),
        lng: this.address.geometry.location.lng(),
        addressLine: this.address.formatted_address,
        url: this.address.url

      }
      this.order.AddressId = this.address.formatted_address;
      this.orderChanged();
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

  find(){
    this.router.navigate(['/cars'])
  }
}
