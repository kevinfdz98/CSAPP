import { Component, OnInit, OnDestroy } from '@angular/core';
import {GroupService} from 'src/app/services/group/group.service';
import {ActivatedRoute} from '@angular/router';
import {Group} from 'src/app/shared/interfaces/group.interface';
import {GroupSummary} from 'src/app/shared/interfaces/group-summary.interface';
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
  public groupSummary: GroupSummary;

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
          this.subscriptions.add(
            this.groupS.observeGroupsList().subscribe(groupSummaryList => {
              console.log(groupSummaryList[this.gid]);
              if (groupSummaryList && groupSummaryList[this.gid]){
                // Getting info of the specific group from Shared/groupssummary
                this.groupSummary = {...groupSummaryList[this.gid]};
                // Get color of the group
                this.areaColor = (this.groupSummary.majorsTec21.length > 0) ?
                areasList.Tec21[majorsList.Tec21[this.groupSummary.majorsTec21[0]].area].color : 'black';
                // Retrieve logo from students group
                // const storageRef = this.fireStorage.storage;
                // const logoRef = storageRef.ref(`sociedades/${this.gid}.png`);
                // logoRef.getDownloadURL().then(url => {
                //   document.querySelector('.displayLogos').innerHTML +=
                //   `<img src="${url}" alt="Logo de la mesa" class="logos" style= "width: 220px;">`;
                // }).catch( err => {console.log(err); });
              } else {  this.groupSummary = null; }
            })
          );
         }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

}
