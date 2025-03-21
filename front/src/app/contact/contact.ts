import { Component } from '@angular/core';

@Component({
  selector: 'app-hospital-contact',
  template: `
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-4xl font-bold text-center text-blue-600 mb-6">
        Contacto
      </h1>
      <div class="bg-white shadow-md rounded-lg p-6">
        <p class="text-gray-700 text-lg">
          Si deseas más información o necesitas asistencia, no dudes en
          contactarnos. Estamos aquí para ayudarte.
        </p>
        <div class="mt-4">
          <h2 class="text-2xl font-semibold text-gray-800">
            Datos de Contacto
          </h2>
          <p class="mt-2 text-gray-700 text-lg">
            <strong>Teléfono:</strong> +34 123 456 789
          </p>
          <p class="mt-2 text-gray-700 text-lg">
            <strong>Email:</strong> infohospital.com
          </p>
          <p class="mt-2 text-gray-700 text-lg">
            <strong>Dirección:</strong> Calle Ejemplo 123, Ciudad, País
          </p>
        </div>
        <div class="mt-6">
          <h2 class="text-2xl font-semibold text-gray-800">
            Formulario de Contacto
          </h2>
          <form class="mt-4 space-y-4">
            <div>
              <label class="block text-gray-700 text-lg font-medium"
                >Nombre:</label
              >
              <input
                type="text"
                placeholder="Tu nombre"
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label class="block text-gray-700 text-lg font-medium"
                >Email:</label
              >
              <input
                type="email"
                placeholder="Tu email"
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label class="block text-gray-700 text-lg font-medium"
                >Mensaje:</label
              >
              <textarea
                rows="4"
                placeholder="Escribe tu mensaje"
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              ></textarea>
            </div>
            <button
              type="submit"
              class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Enviar
            </button>
          </form>
        </div>
      </div>
    </div>
  `,
})
export class HospitalContactComponent {}
