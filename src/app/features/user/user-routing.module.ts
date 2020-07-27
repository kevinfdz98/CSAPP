import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { UserComponent } from './user.component';
import { FollowingComponent } from './components/following/following.component';

const routes: Routes = [
  { path: 'profile', component: UserComponent },
  { path: 'following', component: FollowingComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UserRoutingModule { }
