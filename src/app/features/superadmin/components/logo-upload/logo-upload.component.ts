import { Component, OnInit, Input, ViewChild, ElementRef  } from '@angular/core';
import { AngularFireStorage } from '@angular/fire/storage';

enum State {
  untouched = 'untouched',
  loading = 'loading',
  preview = 'changed',
  error = 'error',
  uploading = 'uploading',
  uploaded = 'uploaded',
}

@Component({
  selector: 'app-logo-upload',
  templateUrl: './logo-upload.component.html',
  styleUrls: ['./logo-upload.component.css']
})
export class LogoUploadComponent implements OnInit {

  @Input() url: string;
  @ViewChild('inputBtn') inputButtonRef: ElementRef<HTMLInputElement>;

  value: string = null;
  state: State = State.untouched;
  constructor(
    private fireStorage: AngularFireStorage
  ) { }

  ngOnInit(): void {
    this.value = this.url;
    this.state = State.untouched;
  }

  readFile(e: any): void {
    this.state = State.loading;
    const reader = new FileReader();
    reader.onload = () => {
      this.value = reader.result as string;
      this.state = State.preview;
    };
    reader.onerror = () => {
      console.error(reader.error);
      this.value = 'https://d8kaami2d2b7v.cloudfront.net/monthly_2018_05/image.png.4ad83e11b83a2773fe97d82940291c89.png';
      this.state = State.error;
    };
    reader.readAsDataURL(e.target.files[0]);
  }
  public getImageUrl(): Promise<string> {
    // If no image was uploaded, return the same url
    if (this.state === State.untouched || this.state === State.error) {
      return Promise.resolve(this.url);
    }
    // Else, upload new image and return new url
    return this.uploadImage(this.inputButtonRef.nativeElement.files[0]);
  }

  private uploadImage(file: File): Promise<string> {
    // Create a promise for async return
    return new Promise((resolve) => {
      // Change the component state
      this.state = State.uploading;
      // Create reference for new image
      const storageRef = this.fireStorage.storage;
      const reference = storageRef.ref(`sociedades/${file.name}`);
      const task = reference.put(file);
      // Hook to upload events
      task.on('state_changed',
        (next) => console.log(100 * next.bytesTransferred / next.totalBytes),
        (error) => console.error(error),
        () => {
          // On complete, change component state and return downloadUrl
          this.state = State.uploaded;
          // If a previous image existed, delete
          if (this.url) {
            this.fireStorage.storage.refFromURL(this.url).delete()
              .then(val => console.log(val))
              .catch(err => console.error(err));
          }
          // Then return this reference
          task.snapshot.ref.getDownloadURL().then((downloadURL) => resolve(downloadURL));
        }
      );
    });
  }

}
