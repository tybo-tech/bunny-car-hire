import { Component, OnInit } from '@angular/core';
import { AccountService } from 'src/services';

@Component({
  selector: 'app-sign-in-form',
  templateUrl: './sign-in-form.component.html',
  styleUrls: ['./sign-in-form.component.scss']
})
export class SignInFormComponent implements OnInit {
  password: string;
  email: string;
  error: string;
  constructor(private accountService: AccountService,
  ) { }

  ngOnInit() {
  }
  login() {
    this.error = '';
    this.accountService.login({ email: this.email, password: this.password }).subscribe(user => {
      if (user && user.UserId) {
        this.accountService.updateUserState(user);
      }
      else {
        let err: any = user;
        this.error = err + '. , Or contact us if you did not get the mail.' || 'your email or password is incorrect';
      }
    });
  }
}
