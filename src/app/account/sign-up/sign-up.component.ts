import { Component, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { Email } from 'src/models/email.model';
import { ModalModel } from 'src/models/modal.model';
import { User, UserModel } from 'src/models/user.model';
import { AccountService } from 'src/services/account.service';
import { EmailService } from 'src/services/communication';
import { ADMIN, COMPANY_DESCRIPTION, CUSTOMER, IMAGE_DONE, SYSTEM } from 'src/shared/constants';
import { IS_DELETED_FALSE, AWAITING_ACTIVATION } from 'src/shared/status.const';
import { Address } from 'ngx-google-places-autocomplete/objects/address';
import { GooglePlaceDirective } from 'ngx-google-places-autocomplete';
import { AddressComponent } from 'ngx-google-places-autocomplete/objects/addressComponent';
import { OrderService, UserService } from 'src/services';
import { Order } from 'src/models';
import { environment } from 'src/environments/environment';
import { UxService } from 'src/services/ux.service';
import { NavHistoryUX } from 'src/models/UxModel.model';
@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.scss']
})
export class SignUpComponent implements OnInit {
  rForm: FormGroup;
  error: string;
  @ViewChild('places') places: GooglePlaceDirective;

  options = {
    types: [],
    componentRestrictions: { country: 'ZA' }
  }

  selectedSubjects: any[] = [];
  hidePassword = true;
  paymentTypes: any[] = [];
  paymentOption: string;
  showLoader: boolean;

  x: AddressComponent;
  address: Address;
  order: Order;
  model: any;
  user: any;
  navHistory: NavHistoryUX;

  modalHeader: string;
  displayModal: boolean;
  modal = "prime-modal";
  modalBody: string;
  emailTaken: boolean;

  constructor(
    private fb: FormBuilder,
    private routeTo: Router,
    private accountService: AccountService,
    private emailService: EmailService,
    private _location: Location,
    private orderService: OrderService,
    private userService: UserService,
    private uxService: UxService,


  ) { }

  ngOnInit() {
    this.order = this.orderService.currentOrderValue;

    this.rForm = this.fb.group({
      Email: new FormControl(null, Validators.compose([
        Validators.required,
        Validators.email
      ])),
      Password: [null, Validators.required],
      PhoneNumber: [null, Validators.required],
      Name: [null, Validators.required],
      // CompanyName: [null, Validators.required],
      Surname: [''],
      AddressLineHome: [''],
      UserType: CUSTOMER,
      CreateUserId: [SYSTEM],
      ModifyUserId: [SYSTEM],
      IsDeleted: [IS_DELETED_FALSE],
      StatusId: [AWAITING_ACTIVATION]
    });
    this.uxService.uxNavHistoryObservable.subscribe(data => {
      this.navHistory = data;
    })
  }

  back() {
    if (this.navHistory && this.navHistory.BackToAfterLogin) {
      this.routeTo.navigate([this.navHistory.BackToAfterLogin]);
    } else {
      this.routeTo.navigate(['']);
    }
  }
  onSubmit(model: UserModel) {
    model.Roles = [];
    model.Roles.push({ Name: CUSTOMER });
    this.showLoader = true;
    // (this.places)
    model.AddressLineHome = this.address && this.address.formatted_address || model.AddressLineHome;

    model.AddressLineHome = model.AddressLineHome || ''
    model.AddressUrlHome = model.AddressUrlHome || ''
    model.AddressLineWork = model.AddressLineWork || ''
    model.AddressUrlWork = model.AddressUrlWork || ''
    model.Dp = environment.DF_USER_LOGO;
    model.CompanyId = 'bunnycarhire.co.za';

    this.accountService.register(model).subscribe(user => {

      if (user && user.UserType) {
        this.accountService.updateUserState(user);
        this.modalHeader = 'Welcome to bunny car hire.';
        this.modalBody = `Your account has been created successfully`;
        this.displayModal = true;
        this.showLoader = false;
      }
      // send email logic here.
      if (user.Email) {
        this.sendEmail(user);
      } else {
        alert(user);
        this.showLoader = false;
        return;
      }
    });
  }

  handleAddressChange(address: Address) {
    if (address && address.formatted_address) {
      this.address = address;
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



  sendEmail(data: UserModel | User) {
    // const emailToSend: Email = {
    //   Email: data.Email,
    //   Subject: 'Welcome to  Bunny car hire.',
    //   Message: '',
    //   Link: this.accountService.generateAccountActivationReturnLink(data.UserToken)
    // };
    // this.showLoader = true;
    // this.emailService.sendAccountActivationEmail(emailToSend)
    //   .subscribe(response => {
    //     if (response > 0) {

    //     }
    //   });
  }

  getUserByEmail(model: UserModel) {
    this.emailTaken = false;
    this.userService.getUserByEmail(model.Email).subscribe(data => {
      if (data && data.UserId) {
        this.emailTaken = true;
      }
    })
  }

}
