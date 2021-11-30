import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { GooglePlaceDirective } from 'ngx-google-places-autocomplete';
import { Address } from 'ngx-google-places-autocomplete/objects/address';
import { AddressComponent } from 'ngx-google-places-autocomplete/objects/addressComponent';
import { environment } from 'src/environments/environment';
import { User, Email } from 'src/models';
import { UploadService, UserService, AccountService, EmailService } from 'src/services';
import { UxService } from 'src/services/ux.service';
import { COMPANYID, CUSTOMER } from 'src/shared/constants';

@Component({
  selector: 'app-driver-details',
  templateUrl: './driver-details.component.html',
  styleUrls: ['./driver-details.component.scss']
})
export class DriverDetailsComponent implements OnInit {

  @Input() customer: User;
  @Input() customerName: string;
  @Output() addingUserFinished: EventEmitter<User> = new EventEmitter<User>();
  @Input() productId: string
  // <app-add-customer [user]="user">
  @ViewChild('places') places: GooglePlaceDirective;

  options = {
    types: [],
    componentRestrictions: { country: 'ZA' }
  }

  showLoader;
  x: AddressComponent;
  address: Address;

  emailToSend: Email;
  users: User[];
  user: User;
  showGotoCustomer: boolean;
  existingCustomer: User;
  constructor(
    private uploadService: UploadService,
    private userService: UserService,
    private accountService: AccountService,
    private uxService: UxService,
    private router: Router,
    private emailService: EmailService
  ) { }

  ngOnInit() {
    this.user = this.accountService.currentUserValue;
    if (this.user && this.user.UserId && this.user.UserType === CUSTOMER) {
      this.customer = this.user;
      this.userService.getUsers(this.user.CompanyId, CUSTOMER);

    } else {
      this.customer = {
        UserId: '',
        CompanyId: COMPANYID,
        UserType: 'Customer',
        Name: '',
        Surname: '',
        Email: '',
        PhoneNumber: '',
        Password: 'notset',
        Dp: '',
        AddressLineHome: '',
        AddressUrlHome: '',
        AddressLineWork: '',
        AddressUrlWork: '',
        CreateUserId: COMPANYID,
        ModifyUserId: COMPANYID,
        StatusId: '1',
        UserToken: ''
      };
    }
    this.userService.userListObservable.subscribe(data => {
      this.users = data;
    });
  }

  public uploadFile = (files: FileList) => {
    if (files.length === 0) {
      return;
    }

    Array.from(files).forEach(file => {
      // this.uploadService.resizeImage(file, null, this.customer);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', `tybo.${file.name.split('.')[file.name.split('.').length - 1]}`); // file extention
      this.uploadService.uploadFile(formData).subscribe(url => {
        this.customer.Dp = `${environment.API_URL}/api/upload/${url}`;
      });

    });
  }

  save(emit = true) {
    if (this.address && this.address.formatted_address) {
      this.customer.AddressLineHome = this.address.formatted_address;
    }

    if (this.customer.UserId && this.customer.UserId.length > 5) {
      this.userService.updateUserSync(this.customer).subscribe(data => {
        if (data && data.UserId) {
          if (emit)
            this.addingUserFinished.emit(data);
          this.accountService.updateUserState(data);
        }
      })
    }
    else {
      if (this.checkIfCustomerExist()) {
        this.uxService.updateMessagePopState('Customer already exist.');
        this.showGotoCustomer = true;
        return false
      }
      this.userService.add(this.customer).subscribe(data => {
        if (data && data.UserId) {
          this.accountService.updateUserState(data);
          this.view(data)
          if (emit)
            this.addingUserFinished.emit(data);

          // this.sendEmail(data, 'Add-New-Customer');
        }
      });
    }
  }

  sendEmail(user: User, type: string) {
    this.emailService.getCustomerEmails().subscribe(emailData => {
      this.emailToSend = emailData.find(x => x.Type === type)
      this.emailToSend.UserFullName = user.Name;
      this.emailToSend.Email = user.Email;
      this.emailService.sendGeneralTextEmail(this.emailToSend).subscribe(data => {
        if (data > 0) {
          this.addingUserFinished.emit(user);
          this.view(data)

        } else {
          alert('Something went wrong');
        }
      })

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


  getCustomerEmailType(type: string) {
    this.emailToSend = null;
    return this.emailToSend;
  }

  checkIfCustomerExist() {
    const customer = this.users && this.users.find(x => x.Email && x.Email.length > 4 && x.Email.includes('@') && x.Email === this.customer.Email);
    if (customer) {
      this.existingCustomer = customer;
    }
    return customer;
  }

  view(user: User) {
    this.customer = user;
  }
  bindIdCopy(e: string) {
    this.customer.IdCopy = e;
    this.save(false);
  }
  bindProofOfAddress(e: string) {
    this.customer.ProofOfAddress = e;
    this.save(false);
  }
  bindBankStatement(e: string) {
    this.customer.BankStatement = e;
    this.save(false);
  }
  bindDriverLisence(e: string) {
    this.customer.DriverLisence = e;
    this.save(false);
  }
  login() {
    this.uxService.keepNavHistory({
      BackToAfterLogin: `/shop/product/${this.productId}`,
      BackTo: `/shop/product/${this.productId}`,
      ScrollToProduct: null,
    });
    this.router.navigate(['sign-in']);
  }
}
