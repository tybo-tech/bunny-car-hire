import { Component, OnInit } from '@angular/core';
import { User } from 'src/models';
import { AccountService, UserService } from 'src/services';
import { COMPANYID } from 'src/shared/constants';

@Component({
  selector: 'app-sign-up-form',
  templateUrl: './sign-up-form.component.html',
  styleUrls: ['./sign-up-form.component.scss']
})
export class SignUpFormComponent implements OnInit {
  user: User;
  error: string;
  emailTaken: boolean;
  doLogin: boolean;
  constructor(
    private userService: UserService,
    private accountService: AccountService,
  ) { }

  ngOnInit() {
    this.user = {
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
      CreateUserId: 'sign-up',
      ModifyUserId: 'sign-up',
      StatusId: '1',
      UserToken: ''
    }
  }
  register() {
    this.userService.add(this.user).subscribe(data => {
      if (data && data.UserId) {
        this.accountService.updateUserState(data);
      }
    });
  }

  getUserByEmail() {
    this.emailTaken = false;
    this.userService.getUserByEmail(this.user.Email).subscribe(data => {
      if (data && data.UserId) {
        this.emailTaken = true;
      }
    })
  }
}
