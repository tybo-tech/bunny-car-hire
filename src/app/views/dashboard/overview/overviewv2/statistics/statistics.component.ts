import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Order, User } from 'src/models';
import { AccountService, OrderService } from 'src/services';
import { BOOKING_STATUSES } from 'src/shared/constants';

@Component({
  selector: 'app-statistics',
  templateUrl: './statistics.component.html',
  styleUrls: ['./statistics.component.scss']
})
export class StatisticsComponent implements OnInit {
  orders: Order[];
  pendingReview: Order[] = [];
  pendingPayments: Order[] = [];
  paidBookings: Order[] = [];
  currentRentedOutBookings: Order[] = [];
  declinedBookings: Order[] = [];
  BOOKING_STATUSES = BOOKING_STATUSES;
  user: User;
  constructor(
    private orderService: OrderService,
    private accountService: AccountService,
    private router: Router,

  ) { }


  ngOnInit() {
    this.user = this.accountService.currentUserValue;

    this.orderService.OrderListObservable.subscribe(data => {
      this.orders = data || [];
      if (this.orders.length) {
        this.pendingReview = this.orders.filter(x => x.Status === BOOKING_STATUSES.PENDING_APROVAL.Name);
        this.pendingPayments = this.orders.filter(x => x.Status === BOOKING_STATUSES.APPROVED.Name);
        this.paidBookings = this.orders.filter(x => x.Status === BOOKING_STATUSES.PAID.Name);
        this.currentRentedOutBookings = this.orders.filter(x => x.Status === BOOKING_STATUSES.RENTED.Name);
        this.declinedBookings = this.orders.filter(x => x.Status === BOOKING_STATUSES.DECLINED.Name);
      }
    });
    this.orderService.getOrders(this.user.CompanyId);
  }
  goto(url) {
    this.router.navigate([`admin/dashboard/${url}`]);
  }

}
