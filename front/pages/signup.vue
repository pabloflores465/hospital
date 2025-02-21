<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router"; // Importar router para redirección
import Button from "~/components/button.vue";

const router = useRouter(); // Inicializar el router

const user = ref("");
const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const errorMessage = ref("");

const submitForm = async () => {
  if (!user.value || !email.value || !password.value || !confirmPassword.value) {
    errorMessage.value = "Todos los campos son obligatorios.";
    return;
  }

  if (password.value !== confirmPassword.value) {
    errorMessage.value = "Las contraseñas no coinciden.";
    return;
  }

  try {
    const response = await fetch("http://127.0.0.1:8000/insertar_usuario/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: user.value,
        email: email.value,
        password: password.value,
      }),
    });

    if (!response.ok) {
      throw new Error("Error en el registro");
    }

    alert("Registro exitoso. Revisa tu correo para confirmar tu cuenta.");

    // 🔹 Redirigir a la página de login después de registrarse
    router.push("/login");
  } catch (error) {
    errorMessage.value = "Error al registrar usuario";
  }
};
</script>

<template>
  <div class="flex justify-center items-center bg-gray-100 min-h-screen bg-[url('/patient.jpg')] bg-cover bg-center fade-in">
    <div class="bg-white shadow-md rounded-2xl p-6 w-full max-w-sm">
      <div class="ms-2 me-2 mt-2 mb-4 flex items-center justify-center text-xl">
        <strong>Hi!!! Please Tell Us About You</strong>
      </div>

      <div v-if="errorMessage" class="text-red-500 text-center mb-4">
        {{ errorMessage }}
      </div>

      <div class="flex flex-col gap-4">
        <div class="flex items-center">
          <input
            v-model="user"
            type="text"
            placeholder="User"
            class="p-2 rounded-full focus:outline-none focus:bg-blue-100 border-0 w-full"
          />
        </div>

        <div class="flex items-center">
          <input
            v-model="email"
            type="email"
            placeholder="Email"
            class="p-2 rounded-full focus:outline-none focus:bg-blue-100 border-0 w-full"
          />
        </div>

        <div class="flex items-center">
          <input
            v-model="password"
            type="password"
            placeholder="Password"
            class="p-2 rounded-full focus:outline-none focus:bg-blue-100 border-0 w-full"
          />
        </div>

        <div class="flex items-center">
          <input
            v-model="confirmPassword"
            type="password"
            placeholder="Confirm Password"
            class="p-2 rounded-full focus:outline-none focus:bg-blue-100 border-0 w-full"
          />
        </div>

        <Button @click="submitForm">
          <svg class="me-2" stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" height="25px" width="25px" xmlns="http://www.w3.org/2000/svg">
            <path d="M504 256c0 136.967-111.033 248-248 248S8 392.967 8 256 119.033 8 256 8s248 111.033 248 248zM227.314 387.314l184-184c6.248-6.248 6.248-16.379 0-22.627l-22.627-22.627c-6.248-6.249-16.379-6.249-22.628 0L216 308.118l-70.059-70.059c-6.248-6.248-16.379-6.248-22.628 0l-22.627 22.627c-6.248 6.248-6.248 16.379 0 22.627l104 104c6.249 6.249 16.379 6.249 22.628.001z"></path>
          </svg>
          Ready
        </Button>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes fade-in {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}

.fade-in {
  animation: fade-in 1s ease-in forwards;
}

input {
  background: #f5f5f5;
  padding: 10px;
  border-radius: 20px;
  width: 100%;
  border: 1px solid #ccc;
}

input:focus {
  background: #e0f2ff;
  outline: none;
  border-color: #007bff;
}

.text-red-500 {
  color: red;
}
</style>