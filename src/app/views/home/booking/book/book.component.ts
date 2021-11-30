import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Email, Order, Orderproduct, Product, User } from 'src/models';
import { Company } from 'src/models/company.model';
import { LocationModel } from 'src/models/UxModel.model';
import { AccountService, EmailService, OrderService, ProductService, UserService } from 'src/services';
import { UxService } from 'src/services/ux.service';
import { BOOKING_STATUSES, COMPANYID, ITEM_TYPES, NOTIFY_EMAILS, ORDER_TYPE_SALES, USER_TYPES } from 'src/shared/constants';

@Component({
  selector: 'app-book',
  templateUrl: './book.component.html',
  styleUrls: ['./book.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class BookComponent implements OnInit {
  productId: string;
  product: Product;
  company: Company;
  order: Order;
  user: User;
  date14: Date
  USER_TYPES = USER_TYPES;
  pickUpError: boolean;
  dropOffError: boolean;
  showConfirmSave: boolean;
  pickUpLocation: LocationModel;
  showDone: boolean;
  orderNo: string;

  modalHeader: string;
  displayModal: boolean;
  modal = "prime-modal";
  modalBody: string;

  //confrim
  flexCheckDefault1;
  flexCheckDefault2;
  flexCheckDefault3;
  logonClass: string;
  loginClass: string;
  pickUpClass: string;
  dropOffClass: string;
  constructor(
    private activatedRoute: ActivatedRoute,
    private productService: ProductService,
    private orderService: OrderService,
    private accountService: AccountService,
    private userService: UserService,
    private emailService: EmailService,
    private uxService: UxService,
    private router: Router,
    private messageService: MessageService,

  ) {

    this.activatedRoute.params.subscribe(r => {
      this.productId = r.id;
      this.getProduct();

    });
  }

  ngOnInit() {
    this.accountService.user.subscribe(data => {
      this.user = data;
      if (this.user && this.user.UserType === USER_TYPES.CUSTOMER.Name && this.order) {
        this.order.CustomerId = this.user.UserId;
        this.order.Customer = this.user;
      }

      if (!this.user && this.order) {
        this.order.Customer = null;
        this.order.CustomerId = null;
      }
    })
  }
  getProduct() {
    this.productService.getProductSync(this.productId).subscribe(data => {
      this.product = data;
      if (data && data.ProductId) {
        this.company = this.product.Company;
        this.product.Rates = [];
        if (this.product.Items) {
          this.product.Rates = this.product.Items.filter(x => x.ItemType === ITEM_TYPES.PRODUCT_RATES.Name);
        }
        this.product.AllImages = [];
        if (this.product.Images && this.product.Images.length) {
          this.product.AllImages = this.product.Images;
          this.product.Images = [];
          if (this.product.Images[0]) {
            this.product.Images[0].Class = ['active'];
            this.product.FeaturedImageUrl = this.product.Images[0].Url
          }
        }
        this.getOrder();
      }
    })
  }

  getOrder() {
    this.order = this.orderService.currentOrderValue;
    if (!this.order) {
      this.order = {
        OrdersId: '',
        OrderNo: 'Shop',
        CompanyId: this.product.CompanyId,
        Company: this.company,
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
        StatusId: 1
      }
    }

    if (!this.order.PickUpTime)
      this.order.PickUpTime = '10:00';

    if (!this.order.ReturnTime)
      this.order.ReturnTime = '10:00';

    if (!this.order.PickUpDate)
      this.order.PickUpDate = `${this.formatDate(1)}`;

    if (!this.order.ReturnDate)
      this.order.ReturnDate = `${this.formatDate(4)}`;

    this.product.SelectedQuantiy = this.getDateDiff(this.order.PickUpDate, this.order.ReturnDate);

    if (this.product.Rates.length && !this.order.Rate) {
      this.order.Rate = this.product.Rates[0].ItemId;
    }

    if (this.order.Rate) {
      const rate = this.product.Rates.find(x => x.ItemId === this.order.Rate);
      if (rate)
        this.product.RegularPrice = rate.Price;

    }

    if (this.user && this.user.UserType === USER_TYPES.CUSTOMER.Name) {
      this.order.CustomerId = this.user.UserId;
      this.order.Customer = this.user;
    } else {
      this.order.CustomerId = null;
      this.order.Customer = null;
    }

    this.addCarToBooking(this.product);
  }

  formatDate(days = 0) {
    let date = new Date();

    // add a day
    date.setDate(date.getDate() + days);
    let month = '' + (date.getMonth() + 1);
    let day = '' + date.getDate();
    let year = date.getFullYear();

    if (month.length < 2)
      month = '0' + month;
    if (day.length < 2)
      day = '0' + day;

    return [year, month, day].join('-');
  }


  getDateDiff(d1, d2) {
    const date1: any = new Date(d1);
    const date2: any = new Date(d2);
    const diffTime = Math.abs(date2 - date1);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    console.log(diffTime + " milliseconds");
    console.log(diffDays + " days");
    return diffDays;
  }

  addCarToBooking(product: Product) {


    if (product && product.ProductId) {
      this.order.ProductId = product.ProductId;
      this.order.ProductName = product.Name;
      this.order.ProductImage = product.FeaturedImageUrl;
      this.order.Product = product;
      this.order.NumberOfDays = product.SelectedQuantiy;
      this.calculateTotalOverdue();
      this.orderService.updateOrderState(this.order);
    }
  }

  calculateTotalOverdue() {
    this.order.Deposit = Number(this.product.PriceFrom);
    this.order.RatePrice = this.product.RegularPrice;

    this.order.SubTotal = (Number(this.order.Product.RegularPrice) * Number(this.order.NumberOfDays));;
    this.order.Vat = Number(this.order.SubTotal) * Number(this.company.Vat) / 100;

    this.order.Total = Number(this.order.SubTotal) + Number(this.order.Vat) + Number(this.order.Deposit);
    this.order.Due = this.order.Total;
  }


  viewImage(e) { }

  logout() {
    this.accountService.logout(true);
  }

  bindIdCopy(e: string) {
    this.user.IdCopy = e;
    this.saveUserDetails();
  }
  bindProofOfAddress(e: string) {
    this.user.ProofOfAddress = e;
    this.saveUserDetails();
  }
  bindBankStatement(e: string) {
    this.user.BankStatement = e;
    this.saveUserDetails();
  }
  bindDriverLisence(e: string) {
    this.user.DriverLisence = e;
    this.saveUserDetails();
  }


  saveUserDetails() {
    this.userService.updateUserSync(this.user).subscribe(data => {
      if (data && data.UserId) {
        this.accountService.updateUserState(data);
      }
    })
  }

  orderChanged() {
    if (!this.order.PickUpTime)
      this.order.PickUpTime = '10:00';

    if (!this.order.ReturnTime)
      this.order.ReturnTime = '10:00';

    if (!this.order.PickUpDate)
      this.order.PickUpDate = `${this.formatDate()}`;

    if (!this.order.ReturnDate)
      this.order.ReturnDate = `${this.formatDate(3)}`;
    this.product.SelectedQuantiy = this.getDateDiff(this.order.PickUpDate, this.order.ReturnDate);
    if (this.order.Rate) {
      const rate = this.product.Rates.find(x => x.ItemId === this.order.Rate);
      if (rate)
        this.product.RegularPrice = rate.Price;

    }
    this.addCarToBooking(this.product);
  }
  onAdressEvent(event: LocationModel) {
    if (event) {
      const distance = this.calucalateDistance(event);
      if (distance && !isNaN(distance) && distance <= Number(this.company.Location)) {
        this.pickUpError = false;
        this.order.PickUpLocation = event.addressLine;
        this.order.PickUpDirection = event.url;
        this.orderService.updateOrderState(this.order);
      }
      else {
        this.order.PickUpLocation = null;
        this.order.PickUpDirection = null;
        this.pickUpError = true;
        this.orderService.updateOrderState(this.order);

      }
    }

  }

  onDropOfAdressEvent(event: LocationModel) {
    if (event) {
      const distance = this.calucalateDistance(event);
      if (distance && !isNaN(distance) && distance <= Number(this.company.Location)) {
        this.order.DropOffLocation = event.addressLine;
        this.order.DropOffDirection = event.url;
        this.dropOffError = false;
        this.orderService.updateOrderState(this.order);
      }
      else {
        this.order.DropOffLocation = null;
        this.order.DropOffDirection = null;
        this.dropOffError = true;
        this.orderService.updateOrderState(this.order);

      }
    }

  }


  calucalateDistance(toLocation: LocationModel) {
    // From Company to any location
    const cord1: LocationModel = {
      lat: this.company.Latitude,
      lng: this.company.Longitude,
      addressLine: ``,
      url: ``
    }

    const distance = this.uxService.calcCrow(cord1, toLocation);

    return Math.ceil(distance);
  }
  Number(e) {
    return Number(e);
  }

  validateBooking() {
    this.loginClass = '';
    this.pickUpClass = '';
    this.dropOffClass = '';
    if (!this.order.PickUpLocation) {
      this.messageService.add({
        severity: 'error', summary: `Pick up location needed`,
        detail: 'Please enter pick up location to submit the booking'
      });
      window.scroll(0, 0);
      this.pickUpClass = "form_error";
      return;
    }

    if (!this.order.DropOffLocation) {
      this.messageService.add({
        severity: 'error', summary: `Dropp off needed`,
        detail: 'Please enter dropp off location to submit the booking'
      });
      window.scroll(0, 0);
      this.dropOffClass = "form_error";
      return;
    }


    if (!this.user) {
      this.messageService.add({
        severity: 'error', summary: `Driver's information needed`,
        detail: 'Please login or register to submit the booking'
      });
      window.scroll(0, 1000);
      this.loginClass = "form_error";
      return;
    }


    if (!this.user.IdCopy) {
      this.messageService.add({
        severity: 'error', summary: `Id copy is required`,
        detail: 'Please upload your Id Copy'
      });
    }

    if (!this.user.IdCopy) {
      this.messageService.add({
        severity: 'error', summary: `Id copy is  required`,
        detail: 'Please upload your Id Copy'
      });
    }

    if (!this.user.BankStatement) {
      this.messageService.add({
        severity: 'error', summary: `Bank Statement is required`,
        detail: 'Please upload your 3 Months Bank Statement'
      });
    }


    if (!this.user.DriverLisence) {
      this.messageService.add({
        severity: 'error', summary: `Driver Lisence Copy is  required`,
        detail: 'Please upload your Driver Lisence Copy'
      });
    }


    if (!this.user.IdCopy || !this.user.BankStatement || !this.user.ProofOfAddress || !this.user.DriverLisence) {
      window.scroll(0, 1000);
      this.loginClass = "form_error";
      return;
    }
    this.showConfirmSave = true
  }
  saveInvoice() {
    if (!this.user) {
      this.messageService.add({
        severity: 'error', summary: `Driver's information needed`,
        detail: 'Please login or register to submit the booking'
      });
      // this.messageService.add({ severity: 'success', summary: 'Message sent', detail: 'Your message was sent successfully we will contact you soon ' });

      return;
    }
    if (!this.order.CustomerId && this.user) {
      this.order.CustomerId = this.user.UserId;
    }
    if (!this.order.Shipping) {
      this.order.Shipping = '';
    }
    if (!this.order.ShippingPrice) {
      this.order.ShippingPrice = 0;
    }

    this.order.CompanyId = COMPANYID;
    this.order.OrderSource = 'Online';
    this.order.EstimatedDeliveryDate = '';
    this.order.StatusId = 1;

    this.order.Status = BOOKING_STATUSES.PENDING_APROVAL.Name;
    this.order.OrderNo = new Date().getTime().toString();

    this.orderService.create(this.order).subscribe(data => {
      if (data && data.OrdersId) {
        this.uxService.hideLoader();
        this.showDone = true;
        this.orderNo = this.order.OrderNo;
        this.productService.adjustStockAfterSale(this.order, this.product);
        this.order = data;
        this.showConfirmSave = false;
        const body = `Congratulations you have received an booking of 
          R${this.order.Total} for ${this.order.NumberOfDays}
           days on the ${this.order.ProductName}, 
           please login to the system to review the booking. 
          <p> <br>
          <b>
          <a href="https://bunnycarhire.co.za/sign-in">Click here to login</a>
          </b>
          </p>
          `;
        const customerEMail = `  Your booking, is being reviewed.
                          Once your booking is reviewed, you'll receive 
                          an Email notification with payment details.
                          <b>Your booking number is :  ${this.order.OrderNo}</b> <br> <br>
                          <a  style='background: #4CAF50; color: #fff; padding: 1em 2em; border-radius: .5em;' href="https://bunnycarhire.co.za/home/track/${this.order.OrderNo}">View booking</a>

                          `;

        this.modalHeader = 'Booking sent for review';
        this.modalBody = customerEMail;
        this.displayModal = true;

        if (this.company && this.company.Email) {
          this.sendEmailLogToShop(body, 'Admin', NOTIFY_EMAILS);
          this.sendEmailLogToCustomer(customerEMail, this.user.Name || '', this.user.Email, "Your booking was successfully placed ");
        }
        this.orderService.updateOrderState(null);
      }
    });





  }
  sendEmailLogToCustomer(data, companyName: string, email: string, sub = 'New order placed & paid') {
    const emailToSend: Email = {
      Email: email,
      Subject: sub,
      Message: `${data}`,
      UserFullName: companyName
    };
    this.emailService.sendGeneralTextEmail(emailToSend)
      .subscribe(response => {
        if (response > 0) {

        }
      });
  }


  sendEmailLogToShop(data, companyName: string, email: string) {
    const emailToSend: Email = {
      Email: email,
      Subject: 'New booking  submitted for verification.',
      Message: `${data}`,
      UserFullName: companyName,
    };
    this.emailService.sendGeneralTextEmail(emailToSend)
      .subscribe(response => {
        if (response > 0) {

        }
      });
  }

  bookings() {
    this.router.navigate(['/home/my-orders']);

  }
  back() {
    this.router.navigate(['']);

  }
}
