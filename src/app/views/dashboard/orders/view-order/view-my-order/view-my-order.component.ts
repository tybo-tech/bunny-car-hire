import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { Order, User, Email } from 'src/models';
import { ModalModel } from 'src/models/modal.model';
import { OrderService, AccountService, EmailService } from 'src/services';
import { UxService } from 'src/services/ux.service';
import { BOOKING_STATUSES, COMPANYID, COMPANY_EMIAL, IMAGE_DONE, NOTIFY_EMAILS } from 'src/shared/constants';

@Component({
  selector: 'app-view-my-order',
  templateUrl: './view-my-order.component.html',
  styleUrls: ['./view-my-order.component.scss']
})
export class ViewMyOrderComponent implements OnInit {

  OrderId: any;
  order: Order;
  showAdd: boolean;
  user: User;
  showAddCancel: boolean;

  BOOKING_STATUSES = BOOKING_STATUSES;
  modalModel: ModalModel = {
    heading: undefined,
    body: [],
    ctaLabel: 'Go to orders',
    routeTo: '/admin/dashboard/invoices',
    img: undefined
  };
  formError: string;

  // PAyfast

  companyId: string;
  productName = '';
  productDescription = '';
  merchantId = '18700870';
  merchantKey = 'r03aarj23x3wz';
  shopingSuccesfulUrl: string;
  paymentCallbackUrl: string;
  paymentCancelledUrl: string;

  constructor(
    private activatedRoute: ActivatedRoute,
    private orderService: OrderService,
    private router: Router,
    private accountService: AccountService,
    private emailService: EmailService,
    private uxService: UxService,
  ) {
    this.activatedRoute.params.subscribe(r => {
      this.OrderId = r.id;
    });
  }

  ngOnInit() {
    this.user = this.accountService.currentUserValue;





    this.orderService.getOrderSync(this.OrderId).subscribe(order => {
      this.order = order;
      if (this.order && Number(this.order.Paid) === 0 && Number(this.order.Due) === 0) {
        this.order.Due = this.order.Total;
      }

      if (order) {

        if (order.Customer) {
          let email = order.Customer.Email;
          if (email && email.toLocaleLowerCase() === 'Bananhlaka@gmail.com'.toLocaleLowerCase()) {
            order.Customer.Email = COMPANY_EMIAL
          }
        }
      }

      //payfast

      this.companyId = COMPANYID;
      this.shopingSuccesfulUrl = `${environment.BASE_URL}/home/booking-succesful/${this.order.OrdersId}`;
      this.paymentCancelledUrl = `${environment.BASE_URL}/home/view-my-order/${this.order.OrdersId}`;
      this.paymentCallbackUrl = `${environment.BASE_URL}/home/payment-callback`;
      this.productName = `${this.order.ProductName}`;
      this.productDescription = `${this.order.ProductName} for ${order.NumberOfDays} @R${order.RatePrice}`;
      if (this.productName.length > 100) {
        this.productName = this.productName.substring(0, 99);
      }
      if (this.productDescription.length > 255) {
        this.productDescription = this.productDescription.substring(0, 254);
      }
    });

  }
  orderAction(action: string) {
    if (action === 'Cancel') {
      this.showAddCancel = true;
    }
    if (action === 'Accept') {
      this.showAdd = true;
    }
  }
  updateOrder() {
    this.showAdd = false;
    this.showAddCancel = false;
    this.orderService.update(this.order).subscribe(data => {
      if (data && data.OrdersId) {
        this.modalModel.heading = `Order accepted and in it is in progress.`
        this.modalModel.img = IMAGE_DONE;
        this.modalModel.ctaLabel = 'Go to dashboard';
        this.modalModel.routeTo = `admin/dashboard`;
        this.modalModel.body.push(`Order accepted.`);
        this.modalModel.body.push(`Please press "Ship order"  on the order screen when the order is shipped`);

        const body = `Congratulations, your order has been accepted by the seller and it is in progress.
        The estimated shipping date is : ${this.order.EstimatedDeliveryDate}.
        We will send you the email as soon the seller confirms the shipment.
        
        `;
        this.sendEmailLogToShop(body, this.order.Customer.Name, this.order.Customer.Email);
        this.sendEmailLogToShop(body, this.order.Customer.Name, NOTIFY_EMAILS);
      }
    });
  }

  sendEmailLogToShop(data, companyName: string, email: string) {
    const emailToSend: Email = {
      Email: email,
      Subject: 'New order accepted & in  progress.',
      Message: `${data}`,
      UserFullName: companyName,
      Link: `${environment.BASE_URL}/private/order-details/${this.order.OrdersId}`,
      LinkLabel: 'View booking'
    };
    this.emailService.sendGeneralTextEmail(emailToSend)
      .subscribe(response => {
        if (response > 0) {

        }
      });
  }

  validateDate() {
    this.formError = undefined;
    const todaysDate = new Date();
    todaysDate.setDate(todaysDate.getDate());
    if (new Date(this.order.EstimatedDeliveryDate).getTime() < todaysDate.getTime()) {
      this.formError = 'Sorry, the date can not be in the past!';
      this.order.EstimatedDeliveryDate = undefined;

    }
  }

  print() {
    this.uxService.updateMessagePopState('Invoice downloading ...');
    const url = this.orderService.getInvoiceURL(this.order.OrdersId);
    const win = window.open(url, '_blank');
    win.focus();
  }

  goto(url: string) {

    if (url === 'home/my-orders' && this.user) {
      this.router.navigate([url]);
    }

    if (url === 'home/my-orders' && !this.user) {
      this.uxService.keepNavHistory({
        BackToAfterLogin: url,
        BackTo: url,
        ScrollToProduct: null
      });
      this.router.navigate(['sign-in']);
    }
    if (url === '') {
      this.router.navigate([url]);
    }
  }

  getButtonLabel() {
    if (this.order.Status === BOOKING_STATUSES.APPROVED.Name) {
      return 'Make a payment'
    }
    if (this.order.Status === BOOKING_STATUSES.PENDING_APROVAL.Name) {
      return 'We are currently reviewing your booking'
    }
    if (this.order.Status === BOOKING_STATUSES.DECLINED.Name) {
      return 'Sorry your booking was declined'
    }
  }
  orderClicked() {

    if (this.order.Status === BOOKING_STATUSES.PENDING_APROVAL.Name) {
      return 'We are currently reviewing your booking'
    }
  }
}
