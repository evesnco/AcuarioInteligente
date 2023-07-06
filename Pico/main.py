import machine
import onewire
import ds18x20
import time
from machine import Pin, PWM

def sensores():
    ds_pin = machine.Pin(8)
    ds_sensor = ds18x20.DS18X20(onewire.OneWire(ds_pin))
    roms = ds_sensor.scan()
    
    TRIG_PIN = 14
    ECHO_PIN = 15

    # Configura los pines GPIO
    trig = machine.Pin(TRIG_PIN, machine.Pin.OUT)
    echo = machine.Pin(ECHO_PIN, machine.Pin.IN)
    
    # Función para medir la distancia
    def distance():
        # Genera un pulso de 10us en el pin TRIG
        trig.value(0)
        time.sleep_us(2)
        trig.value(1)
        time.sleep_us(10)
        trig.value(0)

        # Mide la duración del pulso en el pin ECHO
        duration = machine.time_pulse_us(echo, 1, 10000)

        # Calcula la distancia en centímetros
        distance = duration / 58.0

        return distance

    while True:
        ds_sensor.convert_temp()
        time.sleep_ms(750)
        for rom in roms:
            temp = ds_sensor.read_temp(rom)
            print('{:.2f}°C'.format(temp))
        time.sleep(0.5)

        # Mide la distancia
        dist = distance()

        # Imprime la distancia en la consola
        if dist >= 20:
            print("El tanque está vacío")
        elif dist <= 5:
            print("El tanque está lleno")
        elif dist > 5 and dist < 20:
            print("El tanque está a {} cm de llenarse".format(dist))
        else:
            print("{} cm".format(dist))

        # Espera 1 segundo antes de volver a medir
        time.sleep(1)



    
# Función principal
def main():
    # Llamada a las funciones que deseas ejecutar
    sensores()


# Llamada al main
if __name__ == "__main__":
    main()
    
# Agregar una pequeña pausa antes de terminar el programa
time.sleep(0.1)
