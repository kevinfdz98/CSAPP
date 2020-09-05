import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { UserComponent } from './user.component';
import { FavoriteComponent } from './components/favorite/favorite.component';
import { RegistersComponent } from './components/registers/registers.component';
import { FollowingComponent } from './components/following/following.component';

const routes: Routes = [
  { path: 'profile', component: UserComponent },
  { path: 'favorites', component: FavoriteComponent },
  { path: 'registered', component: RegistersComponent },
  { path: 'subscriptions', component: FollowingComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UserRoutingModule { }
