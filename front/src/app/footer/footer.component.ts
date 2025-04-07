import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import axios from 'axios';
import { back_url } from '../../environments/back_url';
interface footer {
  title1: string;
  title2: string;
  title3: string;
  text1: string;
  info1: string;
  info2: string;
  info3: string;
  info4: string;
  social1: string;
  social2: string;
  social3: string;
}

@Component({
  selector: 'app-footer',
  imports: [CommonModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css',
})
export class FooterComponent {
  async ngOnInit() {
    await this.get_footer();
  }
  footer_info = signal<footer>({
    title1: '',
    title2: '',
    title3: '',
    text1: '',
    info1: '',
    info2: '',
    info3: '',
    info4: '',
    social1: '',
    social2: '',
    social3: '',
  });
  async get_footer() {
    const url = await back_url();
    axios
      .get(`${url}/footer/`)
      .then((response) => {
        console.log(response.data.footer);
        this.footer_info.set(response.data.footer);
      })
      .catch((error) => {
        console.log(error);
      });
  }
}
