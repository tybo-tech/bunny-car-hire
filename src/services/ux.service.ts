import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HomeNavUx, LoaderUx, LocationModel, NavHistoryUX } from 'src/models/UxModel.model';

@Injectable({
  providedIn: 'root'
})


export class UxService {



  private uxMessagePopBehaviorSubject: BehaviorSubject<string>;
  public uxMessagePopObservable: Observable<string>;

  private uxNavHistoryBehaviorSubject: BehaviorSubject<NavHistoryUX>;
  public uxNavHistoryObservable: Observable<NavHistoryUX>;

  private navBarLogoBehaviorSubject: BehaviorSubject<HomeNavUx>;
  public navBarLogoObservable: Observable<HomeNavUx>;

  private showIntroPageBehaviorSubject: BehaviorSubject<string>;
  public showIntroPageObservable: Observable<string>;

  private uxLoadingBehaviorSubject: BehaviorSubject<LoaderUx>;
  public uxLoadingPopObservable: Observable<LoaderUx>;

  private uxHomeSideNavBehaviorSubject: BehaviorSubject<boolean>;
  public uxHomeSideNavObservable: Observable<boolean>;


  private pageYPositionBehaviorSubject: BehaviorSubject<number>;
  public pageYPositionObservable: Observable<number>;

  constructor() {
    this.uxMessagePopBehaviorSubject = new BehaviorSubject<string>(null);
    this.uxMessagePopObservable = this.uxMessagePopBehaviorSubject.asObservable();

    this.uxLoadingBehaviorSubject = new BehaviorSubject<LoaderUx>(null);
    this.uxLoadingPopObservable = this.uxLoadingBehaviorSubject.asObservable();

    this.navBarLogoBehaviorSubject = new BehaviorSubject<HomeNavUx>(JSON.parse(localStorage.getItem('HomeNavUx')));
    this.navBarLogoObservable = this.navBarLogoBehaviorSubject.asObservable();

    this.showIntroPageBehaviorSubject = new BehaviorSubject<string>(JSON.parse(localStorage.getItem('ShowIntroPage')));
    this.showIntroPageObservable = this.showIntroPageBehaviorSubject.asObservable();


    this.uxNavHistoryBehaviorSubject = new BehaviorSubject<NavHistoryUX>(JSON.parse(localStorage.getItem('NavHistoryUX')));
    this.uxNavHistoryObservable = this.uxNavHistoryBehaviorSubject.asObservable();


    this.uxHomeSideNavBehaviorSubject = new BehaviorSubject<boolean>(null);
    this.uxHomeSideNavObservable = this.uxHomeSideNavBehaviorSubject.asObservable();


    this.pageYPositionBehaviorSubject = new BehaviorSubject<number>(null);
    this.pageYPositionObservable = this.pageYPositionBehaviorSubject.asObservable();

  }

  public get currentMessagePopValue(): string {
    return this.uxMessagePopBehaviorSubject.value;
  }

  public get currentNavBarLogoValue(): HomeNavUx {
    return this.navBarLogoBehaviorSubject.value;
  }

  updatePageYPositionState(state: number) {
    if (state) {
      this.pageYPositionBehaviorSubject.next(state);
    }
  }
  updateMessagePopState(state: string) {
    if (state) {
      this.uxMessagePopBehaviorSubject.next(state);
    }
  }
  updateNavBarLogoState(state: HomeNavUx) {
    if (state) {
      this.navBarLogoBehaviorSubject.next(state);
      localStorage.setItem('HomeNavUx', JSON.stringify(state));
    }
  }
  updateLoadingState(state: LoaderUx) {
    if (state) {
      this.uxLoadingBehaviorSubject.next(state);
    }
  }

  hideLoader() {
    this.uxLoadingBehaviorSubject.next({ Loading: false, Message: undefined });
  }
  showLoader() {
    this.uxLoadingBehaviorSubject.next(({ Loading: true, Message: 'Loading, please wait.' }));
  }
  hideHomeSideNav() {
    this.uxHomeSideNavBehaviorSubject.next(false);
  }
  showHomeSideNav() {
    this.uxLoadingBehaviorSubject.next(({ Loading: true, Message: 'Loading, please wait.' }));
  }
  keepNavHistory(item: NavHistoryUX) {
    this.uxNavHistoryBehaviorSubject.next(item);
    localStorage.setItem('NavHistoryUX', JSON.stringify(item));

  }
  updateShowIntroPageState(state: string) {
    this.showIntroPageBehaviorSubject.next(state);
    localStorage.setItem('ShowIntroPage', JSON.stringify(state));
  }

  calcCrow(coords1: LocationModel, coords2: LocationModel) {
    // var R = 6.371; // km
    var R = 6371000;
    var dLat = this.toRad(coords2.lat - coords1.lat);
    var dLon = this.toRad(coords2.lng - coords1.lng);
    var lat1 = this.toRad(coords1.lat);
    var lat2 = this.toRad(coords2.lat);

    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c;
    return d / 1000;
  }

  toRad(Value) {
    return Value * Math.PI / 180;
  }
}

