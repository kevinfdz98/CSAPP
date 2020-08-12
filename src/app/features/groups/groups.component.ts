import { Component, OnInit, OnDestroy } from '@angular/core';
import {GroupService} from 'src/app/services/group/group.service';
import {ActivatedRoute} from '@angular/router';
import {Group} from 'src/app/shared/interfaces/group.interface';
import {AngularFireStorage} from '@angular/fire/storage';
import { Subscription } from 'rxjs';
import { areasList } from 'src/app/shared/interfaces/area.interface';
import { majorsList } from 'src/app/shared/interfaces/major.interface';
import { Location } from '@angular/common';

@Component({
  selector: 'app-groups',
  templateUrl: './groups.component.html',
  styleUrls: ['./groups.component.css']
})
export class GroupsComponent implements OnInit, OnDestroy {

  private subscriptions = new Subscription();
  private gid: string;
  public group: Group;
  public areaColor = '#FFFFFF';

  constructor(
    private groupS: GroupService,
    private route: ActivatedRoute,
    private fireStorage: AngularFireStorage,
    public location: Location
  ) { }

  ngOnInit(): void {
    this.subscriptions.add(
      this.route.paramMap.subscribe(params => {
        // Get gid from route params
        this.gid = params.get('gid');
        // fetch group information
        if (this.gid){
          this.groupS.getGroup(this.gid).then( g => {
            if (g) {
              this.group = g;
              this.areaColor = (this.group.majorsTec21.length > 0) ?
              areasList.Tec21[majorsList.Tec21[this.group.majorsTec21[0]].area].color : 'black';
              // Retrieve logo from students group
              const storageRef = this.fireStorage.storage;
              const logoRef = storageRef.ref(`sociedades/${this.group.gid}.png`);
              logoRef.getDownloadURL().then(url => {
                document.querySelector('.displayLogos').innerHTML +=
                `<img src="${url}" alt="Logo de la mesa" class="logos" style= "width: 220px;">`;
              }).catch( err => {});
            } else { this.group = null; }
          });
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

}
