import { Component } from '@angular/core';
import axios from 'axios';
import { CommonModule } from '@angular/common';

interface Recipe {
  id: String;
  date: String;
  patient: String;
  medicines: [
    {
      id: String;
      dosis: String;
      active_principle: String;
      diagnostic: String;
      duration: String;
      frequency: String;
      pharmaceutic_form: String;
      presentation: String;
      quantity: number;
      name: String;
    }
  ];
  doctor: String;
  code: String;
}

@Component({
  selector: 'recipes-page',
  template: `
    <main>
      <div *ngFor="let recipe of recipes">{{ recipe.code }}</div>
    </main>
  `,
  imports: [CommonModule],
})
export class RecipesPage {
  ngOnInit(): void {
    this.loadRecipes();
  }
  recipes: Recipe[] = [];
  loadRecipes: () => Promise<void> = async (): Promise<void> => {
    axios
      .get('http://127.0.0.1:8000/recipes')
      .then((response) => {
        console.log(response.data.recipes);
        this.recipes = response.data.recipes;
        console.log(this.recipes);
      })
      .catch((error) => {
        console.log(error);
      });
  };
}
