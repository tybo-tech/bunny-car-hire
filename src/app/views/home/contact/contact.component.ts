import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Email } from 'src/models';
import { EmailService } from 'src/services';
import { COMPANY_EMIAL } from 'src/shared/constants';


@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss']
})
export class ContactComponent implements OnInit {

  // <app-add-customer [user]="user">
  name;
  email;
  massage;
  phone;
  address;

  showLoader;
  sent: boolean;
  constructor(
    private emailService: EmailService,
    private router: Router,
    private messageService: MessageService,
  ) { }

  ngOnInit() {
  }


  back() {
    this.router.navigate([``]);
  }

  sendEmail() {
    const emailToSend: Email = {
      From: this.email,
      Email: COMPANY_EMIAL,
      Subject: this.name + ' Enquiry',
      Message: `${this.massage}  <br><hr> ${this.email} <br> ${this.phone}`,
      UserFullName: this.name,
      FromName: this.name,
      ToName: 'Team',
    };
    this.showLoader = true;
    this.emailService.sendGeneralTextEmail(emailToSend)
      .subscribe(response => {
        if (response > 0) {
          this.messageService.add({ severity: 'success', summary: 'Message sent', detail: 'Your message was sent successfully we will contact you soon ' });
          this.router.navigate(['']);
        } else
          this.messageService.add({ severity: 'error', summary: 'Message was not sent', detail: 'Your message was not sent please try again' });

        //Thank you for contacting us we will reply as soon as possible

      });
  }

}
