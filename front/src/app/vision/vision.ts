import { Component } from '@angular/core';

@Component({
  selector: 'app-hospital-vision',
  template: `
    <section
      class="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4"
    >
      <div class="max-w-3xl w-full bg-white rounded-lg shadow-lg p-8">
        <h1 class="text-3xl font-bold mb-4 text-center text-gray-800">
          Nuestra Visión
        </h1>
        <p class="text-gray-600 mb-6 text-center">
          Convertirnos en el centro de salud líder a nivel regional, reconocido
          por la excelencia en la atención al paciente y la innovación médica,
          generando un impacto positivo y duradero en la comunidad.
        </p>

        <div class="mb-6">
          <h2 class="text-xl font-semibold text-gray-800 mb-2">
            Aspiraciones Clave
          </h2>
          <ul class="list-disc ml-6 text-gray-700 space-y-2">
            <li>
              Brindar atención de clase mundial respaldada por tecnología de
              vanguardia.
            </li>
            <li>
              Desarrollar programas de formación e investigación de alto
              impacto.
            </li>
            <li>
              Construir alianzas estratégicas para mejorar el acceso a la
              atención médica.
            </li>
            <li>
              Fomentar la confianza y la satisfacción de nuestros pacientes y
              sus familias.
            </li>
          </ul>
        </div>

        <div class="flex flex-col md:flex-row gap-4">
          <!-- Tarjeta 1: Excelencia Operativa -->
          <div class="bg-gray-100 rounded-lg p-4 flex-1">
            <h3 class="text-lg font-semibold mb-2 text-gray-800">
              Excelencia Operativa
            </h3>
            <p class="text-gray-600">
              Optimizar continuamente nuestros procesos internos para ofrecer un
              servicio eficiente y de la más alta calidad.
            </p>
          </div>

          <!-- Tarjeta 2: Sostenibilidad -->
          <div class="bg-gray-100 rounded-lg p-4 flex-1">
            <h3 class="text-lg font-semibold mb-2 text-gray-800">
              Sostenibilidad
            </h3>
            <p class="text-gray-600">
              Procurar un modelo de gestión responsable y sustentable que
              garantice el crecimiento y la estabilidad a largo plazo.
            </p>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [],
})
export class HospitalVisionComponent {}
