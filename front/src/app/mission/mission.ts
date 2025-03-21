import { Component } from '@angular/core';

@Component({
  selector: 'app-hospital-mision',
  template: `
    <section
      class="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4"
    >
      <div class="max-w-3xl w-full bg-white rounded-lg shadow-lg p-8">
        <h1 class="text-3xl font-bold mb-4 text-center text-gray-800">
          Nuestra Misión
        </h1>
        <p class="text-gray-600 mb-6 text-center">
          Proveer servicios de salud de alta calidad, centrados en la seguridad
          del paciente y la excelencia en la atención, impulsados por la
          investigación y la formación continua de nuestro equipo
          multidisciplinario.
        </p>

        <div class="mb-6">
          <h2 class="text-xl font-semibold text-gray-800 mb-2">
            Pilares de Nuestra Misión
          </h2>
          <ul class="list-disc ml-6 text-gray-700 space-y-2">
            <li>Atención integral y humanizada para nuestros pacientes.</li>
            <li>Formación continua de nuestros profesionales de la salud.</li>
            <li>Investigación e innovación para el avance médico.</li>
            <li>Responsabilidad social y compromiso con la comunidad.</li>
          </ul>
        </div>

        <div class="flex flex-col md:flex-row gap-4">
          <!-- Tarjeta 1: Atención al Paciente -->
          <div class="bg-gray-100 rounded-lg p-4 flex-1">
            <h3 class="text-lg font-semibold mb-2 text-gray-800">
              Atención al Paciente
            </h3>
            <p class="text-gray-600">
              Nuestro objetivo es ofrecer una experiencia hospitalaria de primer
              nivel, con enfoque en la dignidad y el bienestar de todos nuestros
              pacientes.
            </p>
          </div>

          <!-- Tarjeta 2: Innovación -->
          <div class="bg-gray-100 rounded-lg p-4 flex-1">
            <h3 class="text-lg font-semibold mb-2 text-gray-800">Innovación</h3>
            <p class="text-gray-600">
              Invertimos en tecnología de vanguardia y promovemos la
              investigación para mantenernos a la vanguardia de la medicina
              moderna.
            </p>
          </div>
        </div>
      </div>
    </section>
  `,
  // Podemos dejar styles vacío o incluso omitirlo, puesto que estamos usando Tailwind para estilos:
  styles: [],
})
export class HospitalMisionComponent {}
