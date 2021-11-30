import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { environment } from 'src/environments/environment';
import { UploadService } from 'src/services';

@Component({
  selector: 'app-file-uploader',
  templateUrl: './file-uploader.component.html',
  styleUrls: ['./file-uploader.component.scss']
})
export class FileUploaderComponent implements OnInit {
  @Input() label: string;
  @Input() img: string;
  @Input() imgLabel: string;
  @Output() urlEvent = new EventEmitter<string>();
  change: boolean
  constructor(    private uploadService: UploadService,
    ) { }

  ngOnInit() {
  }
  done(url){
    this.urlEvent.emit(url);
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
       this.done(`${environment.API_URL}/api/upload/${url}`);
      });

    });
  }

}
