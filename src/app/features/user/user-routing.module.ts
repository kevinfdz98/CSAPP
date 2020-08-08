import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { UserComponent } from './user.component';
import { FavoriteComponent } from './components/favorite/favorite.component';
import { FollowingComponent } from './components/following/following.component';

const routes: Routes = [
  { path: 'profile', component: UserComponent },
  { path: 'favorite', component: FavoriteComponent },
  { path: 'subscriptions', component: FollowingComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UserRoutingModule { }
