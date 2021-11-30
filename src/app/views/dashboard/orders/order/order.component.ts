import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { Email, User } from 'src/models';
import { ModalModel } from 'src/models/modal.model';
import { Order } from 'src/models/order.model';
import { AccountService } from 'src/services/account.service';
import { OrderService } from 'src/services/order.service';
import { UxService } from 'src/services/ux.service';
import { ADMIN, BOOKING_STATUSES, IMAGE_DONE, NOTIFY_EMAILS, SUPER } from 'src/shared/constants';
import { Location } from '@angular/common';
import { environment } from 'src/environments/environment';
import { EmailService } from 'src/services/communication/email.service';
import { ProductService } from 'src/services';

@Component({
  selector: 'app-order',
  templateUrl: './order.component.html',
  styleUrls: ['./order.component.scss']
})
export class OrderComponent implements OnInit {

  OrderId: string;
  success: string;
  error: string;
  showModal: boolean;
  modalHeading: string;
  order: Order;
  showPay: boolean;
  orderPayment: number;
  modalModel: ModalModel = {
    heading: undefined,
    body: [],
    ctaLabel: 'Go to orders',
    routeTo: '/admin/dashboard/invoices',
    img: undefined
  };
  user: User;
  isAdmin: boolean;
  showNotes: boolean;
  reasonHeader: string;
  reasonAction: string;
  constructor(
    private activatedRoute: ActivatedRoute,
    private orderService: OrderService,
    private router: Router,
    private accountService: AccountService,
    private uxService: UxService,
    private snackBar: MatSnackBar,
    private location: Location,
    private emailService: EmailService,
    private productService: ProductService,


  ) {
    this.activatedRoute.params.subscribe(r => {
      this.OrderId = r.id;
    });
  }

  ngOnInit() {
    this.user = this.accountService.currentUserValue;
    if (!this.user) {
      this.router.navigate(['sign-in'])
    }

    if (this.user && this.user.UserType === SUPER) {
      this.isAdmin = true;
    }
    this.order = this.orderService.currentOrderValue;
    this.orderService.getOrder(this.OrderId);
    this.orderService.OrderObservable.subscribe(order => {
      this.order = order;
      if (this.order && Number(this.order.Paid) === 0 && Number(this.order.Due) === 0) {
        this.order.Due = this.order.Total;
      }
    });
  }

  back() {
    // this.router.navigate([`/admin/dashboard/invoices/all`]);
    this.location.back();
  }
  add() {
    this.showModal = true;
    this.modalHeading = `Add Order options`;
  }
  closeModal() {
    this.showModal = false;
  }

  openSnackBar(message, heading) {
    const snackBarRef = this.snackBar.open(message, heading, {
      duration: 3000
    });
    console.log(snackBarRef);


  }
  saveAll() { }
  print() {
    this.uxService.updateMessagePopState('Invoice downloading ...');
    const url = this.orderService.getInvoiceURL(this.order.OrdersId);
    const win = window.open(url, '_blank');
    win.focus();
  }
  pay() {
    this.showPay = !this.showPay;
  }
  confirmPayment() {
    this.order.Due = Number(this.order.Due) - Number(this.orderPayment);
    this.order.Paid = Number(this.order.Paid) + Number(this.orderPayment);
    this.order.StatusId = Number(this.order.StatusId);
    if (this.order.Due === 0) {
      this.order.Status = 'Processing';
    }
    this.orderService.update(this.order).subscribe(data => {
      if (data && data.OrdersId) {
        this.showPay = false;
        this.modalModel.heading = `Success!`
        this.modalModel.img = IMAGE_DONE;
        this.modalModel.ctaLabel = 'Done';
        this.modalModel.routeTo = `admin/dashboard/order/${data.OrdersId}`;
        this.modalModel.body.push(`Payment of ${this.orderPayment} recorded`);
        this.order = data;
        this.orderService.updateOrderState(this.order);
        this.orderPayment = undefined;
      }
    });
  }
  ship() {
    this.order.Status = 'On transit';
    this.orderService.update(this.order).subscribe(data => {
      if (data && data.OrdersId) {
        this.showPay = false;
        this.modalModel.heading = `Success!`
        this.modalModel.img = IMAGE_DONE;
        this.modalModel.routeTo = `admin/dashboard/order/${data.OrdersId}`;
        this.modalModel.body.push(`1. Order status updated to in transit.`);
        this.modalModel.body.push(`2. Customer got the email that their order is on its way.`);
        this.order = data;
        this.orderService.updateOrderState(this.order);
      }
    });
  }

  copy() {
    this.uxService.updateMessagePopState('Copied to clipboard.')
  }




  getButtonLabel(action: string) {
    if (this.order.Status === BOOKING_STATUSES.PENDING_APROVAL.Name) {
      if (action == 'primary')
        return 'Approve';
      else
        return 'Decline';
    }


    if (this.order.Status === BOOKING_STATUSES.APPROVED.Name) {
      if (action == 'primary')
        return 'Waiting for the payment';
      else
        return 'Cancel';
    }

    if (this.order.Status === BOOKING_STATUSES.PAID.Name) {
      if (action == 'primary')
        return 'Mark car as collected';
      else
        return 'Cancel';
    }

    if (this.order.Status === BOOKING_STATUSES.RENTED.Name) {
      if (action == 'primary')
        return 'Mark car as returned';
      else
        return 'Cancel';
    }
    if (this.order.Status === BOOKING_STATUSES.DECLINED.Name) {
      if (action == 'primary')
        return 'Booking Declined, No furthuer actions needed';
      else
        return null;
    }

    if (this.order.Status === BOOKING_STATUSES.CANCELLED.Name) {
      if (action == 'primary')
        return 'Booking Cancelled, No furthuer actions needed';
      else
        return null;
    }

    if (this.order.Status === BOOKING_STATUSES.RETURNED.Name) {
      if (action == 'primary')
        return 'Car returned, No furthuer actions needed';
      else
        return null;
    }
    return null;
  }

  changeStatus(action: string) {
    if (action == 'primary') {

      //approve
      if (this.order.Status === BOOKING_STATUSES.PENDING_APROVAL.Name) {
        this.order.Status = BOOKING_STATUSES.APPROVED.Name;
        this.orderService.update(this.order).subscribe(data => {
          if (data && data.OrdersId) {
            this.order = data;
            this.orderService.updateOrderState(this.order);

            const approvalEmail = `Congratulations your  booking (<b>${this.order.OrderNo}</b>) of 
          R${this.order.Total} for ${this.order.NumberOfDays}
           days on the ${this.order.ProductName} was <b>Approved</b>, you may proceed to payments.
          <p> <br>
          <b>
          <a  style='background: #4CAF50; color: #fff; padding: 1em 2em; border-radius: .5em;' href="https://bunnycarhire.co.za/home/track/${this.order.OrderNo}">View booking</a>
          </b>
          </p>
          `;
            this.success = 'Booking Approved';
            this.sendEmail(approvalEmail, this.order.Customer.Name, `${this.order.Customer.Email},mrnnmthembu@gmail.com`, 'Booking Approved')
          }
        });
        return 'Approve'
      }


      //Collect
      if (this.order.Status === BOOKING_STATUSES.PAID.Name) {
        this.order.Status = BOOKING_STATUSES.RENTED.Name;
        this.orderService.update(this.order).subscribe(data => {
          if (data && data.OrdersId) {
            this.order = data;
            this.orderService.updateOrderState(this.order);
            this.success = 'Car was collelcted';
          }
        });
        return 'Approve'
      }


      //Return
      if (this.order.Status === BOOKING_STATUSES.RENTED.Name) {
        this.order.Status = BOOKING_STATUSES.RETURNED.Name;
        this.orderService.update(this.order).subscribe(data => {
          if (data && data.OrdersId) {
            this.order = data;
            this.orderService.updateOrderState(this.order);
            this.success = 'Car was returned';
            this.productService.increaseStock(this.order.Product, 1);
          }
        });
        return 'Approve'
      }
    }

    else {
      // Secondary

      if (this.order.Status === BOOKING_STATUSES.PENDING_APROVAL.Name) {
        this.showNotes = true;
        this.reasonHeader = 'Enter the reason(s) for declining.'
        this.reasonAction = 'Confirm Decline'
        return 'Decline';
      }else{
        this.showNotes = true;
        this.reasonHeader = 'Enter the reason(s) for cancelling.'
        this.reasonAction = 'Confirm Cancelling'
        return 'Cancelled';
      }
    }


  }


  decline() {
    if (this.order.Status === BOOKING_STATUSES.PENDING_APROVAL.Name) {
      this.order.Status = BOOKING_STATUSES.DECLINED.Name;
      this.orderService.update(this.order).subscribe(data => {
        if (data && data.OrdersId) {
          this.order = data;
          this.orderService.updateOrderState(this.order);
          this.productService.increaseStock(this.order.Product, 1);

          const approvalEmail = `Sorry, your  booking (${this.order.OrderNo}) of 
      R${this.order.Total} for ${this.order.NumberOfDays}
       days on the ${this.order.ProductName} was <b>Declined</b>, 
       because: <b style='color:red'>${data.Notes}</b>. <br>
       Please try again later. For more enquiries , click  <a  style='background: #4CAF50; color: #fff; padding: 1em 2em; border-radius: .5em;' href="https://bunnycarhire.co.za/contact">here</a>
      <p> <br>
      <b>
      </b>
      </p>
      `;
          this.error = 'Booking Declined';
          this.showNotes = false;
          this.sendEmail(approvalEmail, this.order.Customer.Name, `${this.order.Customer.Email},ndumiso@tybo.co.za`, 'Booking Declined')
        }
      });
      return 'Decline'
    }else{
      this.order.Status = BOOKING_STATUSES.CANCELLED.Name;
      this.orderService.update(this.order).subscribe(data => {
        if (data && data.OrdersId) {
          this.order = data;
          this.orderService.updateOrderState(this.order);
          this.productService.increaseStock(this.order.Product, 1);

          const approvalEmail = `Sorry, your  booking (${this.order.OrderNo}) of 
      R${this.order.Total} for ${this.order.NumberOfDays}
       days on the ${this.order.ProductName} was <b>Cancelled</b>, 
       because: <b style='color:red'>${data.Notes}</b>. <br>
       Please try again later. For more enquiries , click  <a  style='background: #4CAF50; color: #fff; padding: 1em 2em; border-radius: .5em;' href="https://bunnycarhire.co.za/contact">here</a>
      <p> <br>
      <b>
      </b>
      </p>
      `;
          this.error = 'Booking Cancelled';
          this.showNotes = false;
          this.sendEmail(approvalEmail, this.order.Customer.Name, `${this.order.Customer.Email},ndumiso@tybo.co.za`, 'Booking Declined')
        }
      });
      return 'Decline'
    }

    
  }
  sendEmail(data, companyName: string, email: string, subjec: string) {
    const emailToSend: Email = {
      Email: email,
      Subject: subjec,
      Message: `${data}`,
      UserFullName: companyName,
      // Link: `${environment.BASE_URL}/private/order-details/${this.order.OrdersId}`,
      // LinkLabel: 'View booking'
    };
    this.emailService.sendGeneralTextEmail(emailToSend)
      .subscribe(response => {
        if (response > 0) {

        }
      });
  }
}
