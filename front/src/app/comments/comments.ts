import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import axios from 'axios';
import { signal } from '@angular/core';

@Component({
  selector: 'comments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <main>
      <!-- Sección para agregar un nuevo comentario (nivel raíz) -->
      <!--<div class="mt-4">
        <h3>Añadir Comentario</h3>
        <input
          type="text"
          placeholder="Escribe tu comentario"
          [(ngModel)]="newComment.comment"
          class="border rounded px-2 py-1"
        />
        <button
          (click)="submitComment()"
          class="ml-2 bg-blue-400 hover:bg-blue-800 text-white px-4 py-2 rounded"
        >
          Enviar
        </button>
      </div>-->

      <!-- Listado de comentarios principales -->
      <ng-container *ngIf="comments().length; else noComments">
        <ng-container *ngFor="let comment of comments()">
          <div class="ms-2 border-s-2 border-gray-400 ps-2 my-4">
            <p class="font-bold">{{ comment.author || 'Autor desconocido' }}</p>
            <p>
              <small>{{ comment.comment }}</small>
            </p>

            <!-- Botón para abrir/cerrar la respuesta -->
            <button
              class="mt-2 mb-4 text-sm text-blue-400 hover:text-blue-800"
              (click)="toggleReply(comment)"
            >
              responder
            </button>

            <!-- Formulario de respuesta condicional -->
            <div *ngIf="comment.showReply" class="mt-2">
              <input
                type="text"
                placeholder="Escribe tu respuesta"
                [(ngModel)]="comment.replyText"
                class="border rounded px-2 py-1"
              />
              <button
                (click)="submitReply(comment, comment)"
                class="ml-2 bg-green-400 hover:bg-green-800 text-white px-4 py-2 rounded"
              >
                Enviar respuesta
              </button>
            </div>

            <!-- Recursividad para mostrar las respuestas anidadas -->
            <ng-container *ngIf="comment.next_comment?.length">
              <ng-container
                *ngTemplateOutlet="
                  recursiveList;
                  context: { $implicit: comment.next_comment, parent: comment }
                "
              ></ng-container>
            </ng-container>
          </div>
        </ng-container>
      </ng-container>

      <ng-template #noComments>
        <p>No hay comentarios disponibles.</p>
      </ng-template>

      <!-- Plantilla recursiva para respuestas anidadas -->
      <ng-template #recursiveList let-commentsList let-parent="parent">
        <ul class="ms-8 mt-4">
          <li *ngFor="let nested of commentsList">
            <div class="ms-2 border-s-2 border-gray-400 ps-2 mt-2">
              <p class="font-bold">
                {{ nested.author || 'Autor desconocido' }}
              </p>
              <p>
                <small>{{ nested.comment }}</small>
              </p>

              <button
                class="mt-2 mb-4 text-sm text-blue-400 hover:text-blue-800"
                (click)="toggleReply(nested)"
              >
                responder
              </button>

              <div *ngIf="nested.showReply" class="mt-2">
                <input
                  type="text"
                  placeholder="Escribe tu respuesta"
                  [(ngModel)]="nested.replyText"
                  class="border rounded px-2 py-1"
                />
                <button
                  (click)="submitReply(nested, parent)"
                  class="ml-2 bg-green-400 hover:bg-green-800 text-white px-4 py-2 rounded"
                >
                  Enviar respuesta
                </button>
              </div>

              <!-- Recursividad para sub-respuestas -->
              <ng-container *ngIf="nested.next_comment?.length">
                <ng-container
                  *ngTemplateOutlet="
                    recursiveList;
                    context: { $implicit: nested.next_comment }
                  "
                ></ng-container>
              </ng-container>
            </div>
          </li>
        </ul>
      </ng-template>
    </main>
  `,
})
export class Comments implements OnInit {
  @Input() parent_id: string = '67dafe40e20eb0d0a374c1dc';

  //user = '67cc9dac93fa6f271b7fa7d7';

  stored = localStorage.getItem('userData');
  user: string = '67cc9dac93fa6f271b7fa7d7';

  if(stored: any) {
    try {
      const userObj = JSON.parse(stored);
      this.user = userObj._id || '67cc9dac93fa6f271b7fa7d7';
    } catch (err) {
      console.error('Error parsing userData from localStorage:', err);
    }
  }

  comments = signal<any[]>([]);

  newComment: {
    comment: string;
    parent: string;
    author: string;
    author_id: string;
  } = {
    comment: '',
    parent: this.parent_id,
    author: '',
    author_id: this.user,
  };

  async ngOnInit() {
    await this.getComments();
  }

  async getComments() {
    try {
      const response = await axios.get(
        `http://127.0.0.1:8000/comments/${this.parent_id}`
      );
      const rawComments = response.data.comments ?? [];
      const processed = this.parseComments(rawComments).reverse();
      this.comments.set(processed);
      console.log(response.data);
    } catch (error) {
      console.error(error);
    }
  }

  parseComments(commentList: any[]): any[] {
    return commentList.map((c) => {
      return {
        ...c,
        showReply: false,
        replyText: '',
        next_comment: c.next_comment?.length
          ? this.parseComments(c.next_comment)
          : [],
      };
    });
  }

  async addComment(root_comment: string = '', new_comment: any) {
    try {
      const response = await axios.post(
        `http://127.0.0.1:8000/addcomment/${root_comment}`,
        new_comment
      );
      console.log('Comentario agregado:', response.data);
    } catch (error) {
      console.log(error);
    }
  }

  async submitComment() {
    if (!this.newComment.comment.trim()) return;
    await this.addComment('', this.newComment);
    await this.getComments();
    this.newComment.comment = '';
  }

  toggleReply(comment: any) {
    comment.showReply = !comment.showReply;
    this.comments.update((c) => [...c]);
  }

  async submitReply(comment: any, root_comment: any) {
    const text = comment.replyText?.trim();
    if (!text) return;

    const newReply = {
      comment: text,
      author: '',
      author_id: this.user,
      next_comment: [],
    };

    if (comment.next_comment && Array.isArray(comment.next_comment)) {
      comment.next_comment.push(newReply);
    } else {
      comment.next_comment = [newReply];
    }

    comment.parent = this.parent_id;

    await this.addComment(root_comment._id, root_comment);
    await this.getComments();

    comment.replyText = '';
    comment.showReply = false;
    this.comments.update((c) => [...c]);
  }
}
