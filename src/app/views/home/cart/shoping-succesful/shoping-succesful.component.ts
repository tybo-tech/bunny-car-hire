import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { Email, Order, Orderproduct, Product, User } from 'src/models';
import { AccountService, EmailService, OrderService, ProductService, UserService } from 'src/services';
import { CustomerService } from 'src/services/customer.service';
import { UxService } from 'src/services/ux.service';
import { ADMIN, BOOKING_STATUSES, COMPANY_EMIAL, NOTIFY_EMAILS } from 'src/shared/constants';


@Component({
  selector: 'app-shoping-succesful',
  templateUrl: './shoping-succesful.component.html',
  styleUrls: ['./shoping-succesful.component.scss']
})
export class ShopingSuccesfulComponent implements OnInit {
  order: Order;
  showDone: boolean;
  orderNo: string;
  user: User;
  products: Product[];
  orderId: string;

  constructor(
    private orderService: OrderService,
    private router: Router,
    private emailService: EmailService,
    private userService: UserService,
    private customerService: CustomerService,
    private accountService: AccountService,
    private productService: ProductService,
    private uxService: UxService,
    private activatedRoute: ActivatedRoute,

  ) {
    activatedRoute.params.subscribe(r => {
      this.orderId = r.id;
      this.getOrder();
    })
  }

  ngOnInit() {
    this.user = this.accountService.currentUserValue;
  }
  getOrder() {

    this.orderService.getOrderSync(this.orderId).subscribe(order => {
      this.order = order;
      this.order.Due = 0;
      this.order.Paid = order.Total;
      this.order.Status = BOOKING_STATUSES.PAID.Name;
      this.saveInvoice();

    });
  }

  saveInvoice() {
    this.orderService.update(this.order).subscribe(data => {
      if (data && data.OrdersId) {
        this.uxService.hideLoader();
        this.order = data;
        this.showDone = true;
        this.orderNo = this.order.OrderNo;
        this.productService.adjustStockAfterSale(this.order);
        const body = `Congratulations you have received an order of R${this.order.Total}`;
        const customerEMail = `
        
        <div style="text-align: left; max-width: 40em;">


        <p>
          Thank you for completing the payment for ${this.order.ProductName}. <br><br>
          <b>What happens next?</b> <br>
    
          Collect the vihicle on ${this.order.PickUpDate} ${this.order.PickUpTime} <br>
          Pick Up Location: ${this.order.PickUpLocation}  <br> <br>

          <b>
          <a  style='background: #4CAF50; color: #fff; padding: 1em 2em; border-radius: .5em;' href="https://bunnycarhire.co.za/home/track/${this.order.OrderNo}">View my booking</a>
          </b>
        </p>
      </div>`;



      const adminEmail = `
        
      <div style="text-align: left; max-width: 40em;">


      <p>
        The customer: ${this.order.Customer.Name} completed the payment of R${this.order.Total}  for ${this.order.ProductName}. <br><br>
        <b>What happens next?</b> <br>
  
        Collection of  the vihicle on ${this.order.PickUpDate} ${this.order.PickUpTime} <br>
        Pick Up Location: ${this.order.PickUpLocation}  <br> <br>

        <b>
        <a  style='background: #4CAF50; color: #fff; padding: 1em 2em; border-radius: .5em;' href="https://bunnycarhire.co.za/home/track/${this.order.OrderNo}">View my booking</a>
        </b>
      </p>
    </div>`;

        this.sendEmail(
          customerEMail
          , this.order.Customer.Name
          , `${this.order.Customer.Email},mrnnmthembu@gmail.com`
          , 'Payment successful'
          , 'Bunny Car Hire Payments Team',
          this.order.Customer.Name
        );


        this.sendEmail(
          adminEmail
          , 'Bunnt'
          , `${COMPANY_EMIAL} ,mrnnmthembu@gmail.com`
          , 'Payment successful'
          , 'Bunny Car Hire Payments Team',
          'Team'
        );

        this.orderService.updateOrderState(null);
      }
    });
  }


  back() {
    this.router.navigate(['']);
  }
  track() {
    this.router.navigate(['home/my-orders']);
  }


  sendEmail(data, companyName: string, email: string, subjec: string, fromName = 'Bunny Car Hire Payments Team', toName = "There") {
    const emailToSend: Email = {
      Email: email,
      Subject: subjec,
      Message: `${data}`,
      UserFullName: companyName,
      FromName: fromName,
      ToName: toName,
    };
    this.emailService.sendGeneralTextEmail(emailToSend)
      .subscribe(response => {
        if (response > 0) {

        }
      });
  }

}
