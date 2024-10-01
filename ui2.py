import tkinter as tk
from tkinter import ttk
import random
import math
import matplotlib.pyplot as plt
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
import time

class XBeeGroundStation:
    def __init__(self, root):
        self.root = root
        self.root.title("XBee Ground Station")
        self.root.geometry("1200x800")

        # Menu Bar
        self.menu_bar = tk.Menu(self.root)
        self.root.config(menu=self.menu_bar)

        self.file_menu = tk.Menu(self.menu_bar, tearoff=0)
        self.file_menu.add_command(label="Open", command=self.open_file)
        self.file_menu.add_command(label="Save", command=self.save_file)
        self.file_menu.add_separator()
        self.file_menu.add_command(label="Exit", command=self.root.quit)
        self.menu_bar.add_cascade(label="File", menu=self.file_menu)

        self.settings_menu = tk.Menu(self.menu_bar, tearoff=0)
        self.settings_menu.add_command(label="Configure XBee Module", command=self.configure_xbee_module)
        self.settings_menu.add_command(label="Configure Serial Port", command=self.configure_serial_port)
        self.menu_bar.add_cascade(label="Settings", menu=self.settings_menu)

        self.help_menu = tk.Menu(self.menu_bar, tearoff=0)
        self.help_menu.add_command(label="About", command=self.about_window)
        self.help_menu.add_command(label="Documentation", command=self.documentation_window)
        self.menu_bar.add_cascade(label="Help", menu=self.help_menu)

        # Main Panel
        self.main_panel = tk.Frame(self.root, bg="gray")
        self.main_panel.pack(fill="both", expand=True)

        # Rocket Display Panel (Canvas)
        self.canvas = tk.Canvas(self.main_panel, width=400, height=400, bg="black")
        self.canvas.pack(pady=20)
        self.rocket = self.canvas.create_oval(190, 40, 210, 60, fill="white", outline="yellow")
        self.rocket = self.canvas.create_polygon(190, 40, 210, 40, 210, 60, 190, 60, fill="white", outline="yellow")

        # Control Buttons
        self.control_buttons_frame = tk.Frame(self.main_panel, bg="gray")
        self.control_buttons_frame.pack()

        self.launch_rocket_button = tk.Button(self.control_buttons_frame, text="Launch Rocket", command=self.launch_rocket)
        self.launch_rocket_button.pack(side=tk.LEFT, padx=10)

        self.start_receiving_button = tk .Button(self.control_buttons_frame, text="Start Receiving", command=self.start_receiving)
        self.start_receiving_button.pack(side=tk.LEFT, padx=10)

        self.stop_receiving_button = tk.Button(self.control_buttons_frame, text="Stop Receiving", command=self.stop_receiving)
        self.stop_receiving_button.pack(side=tk.LEFT, padx=10)

        self.clear_log_button = tk.Button(self.control_buttons_frame, text="Clear Log", command=self.clear_log)
        self.clear_log_button.pack(side=tk.LEFT, padx=10)

        # Parachute Status and GPS Coordinates
        self.parachute_status = "Not Ejected"
        self.parachute_status_label = tk.Label(self.main_panel, text=f"Parachute Status: {self.parachute_status}", bg="gray", fg="white")
        self.parachute_status_label.pack()

        self.gps_coordinates = (28.7041, 77.1025)  # Default GPS coordinates for simulation
        self.gps_coordinates_label = tk.Label(self.main_panel, text=f"GPS: {self.gps_coordinates}", bg="gray", fg="white")
        self.gps_coordinates_label.pack()

        # Simulate Accelerometer Data
        self.simulated_accelerometer_angle = 0
        self.is_receiving = False
        self.altitude_data = []
        self.acceleration_data = []
        self.temperature_data = []
        self.pressure_data = []
        self.humidity_data = []

        # Graphs frame (horizontal layout)
        self.graphs_frame = tk.Frame(self.main_panel, bg="gray")
        self.graphs_frame.pack(pady=20, fill="x")

        # Altitude Graph
        self.fig_altitude = plt.Figure(figsize=(5, 3), dpi=100)
        self.ax_altitude = self.fig_altitude.add_subplot(111)
        self.ax_altitude.set_title("Altitude (m)")
        self.ax_altitude.set_xlabel("Time")
        self.ax_altitude.set_ylabel("Altitude")

        self.canvas_altitude = FigureCanvasTkAgg(self.fig_altitude, master=self.graphs_frame)
        self.canvas_altitude.get_tk_widget().pack(side=tk.LEFT, padx=10)

        # Acceleration Graph
        self.fig_acceleration = plt.Figure(figsize=(5, 3), dpi=100)
        self.ax_acceleration = self.fig_acceleration.add_subplot(111)
        self.ax_acceleration.set_title("Acceleration (m/s²)")
        self.ax_acceleration.set_xlabel("Time")
        self.ax_acceleration.set_ylabel("Acceleration")

        self.canvas_acceleration = FigureCanvasTkAgg(self.fig_acceleration, master=self.graphs_frame)
        self.canvas_acceleration.get_tk_widget().pack(side=tk.LEFT, padx=10)

        # Temperature Graph
        self.fig_temperature = plt.Figure(figsize=(5, 3), dpi=100)
        self.ax_temperature = self.fig_temperature.add_subplot(111)
        self.ax_temperature.set_title("Temperature (°C)")
        self.ax_temperature.set_xlabel("Time")
        self.ax_temperature.set_ylabel("Temperature")

        self.canvas_temperature = FigureCanvasTkAgg(self.fig_temperature, master=self.graphs_frame)
        self.canvas_temperature.get_tk_widget().pack(side=tk.LEFT, padx=10)

        # # Pressure Graph
        # self.fig_pressure = plt.Figure(figsize=(5, 3), dpi=100)
        # self.ax_pressure = self.fig_pressure.add_subplot(111)
        # self.ax_pressure.set_title("Pressure (Pa)")
        # self.ax_pressure.set_xlabel("Time")
        # self.ax_pressure.set_ylabel("Pressure")

        # self.canvas_pressure = FigureCanvasTkAgg(self.fig_pressure, master=self.graphs_frame)
        # self.canvas_pressure.get_tk_widget().pack(side=tk.LEFT, padx=10)

        # Humidity Graph
        self.fig_humidity = plt.Figure(figsize=(5, 3), dpi=100)
        self.ax_humidity = self.fig_humidity.add_subplot(111)
        self.ax_humidity.set_title("Humidity (%)")
        self.ax_humidity.set_xlabel("Time")
        self.ax_humidity.set_ylabel("Humidity")

        self.canvas_humidity = FigureCanvasTkAgg(self.fig_humidity, master=self.graphs_frame)
        self.canvas_humidity.get_tk_widget().pack(side=tk.LEFT, padx=10)

        # Timer
        self.timer_label = tk.Label(self.main_panel, text="00:00:00", bg="gray", fg="white", font=("Arial", 24))
        self.timer_label.pack()

        self.timer_start_time = 0
        self.timer_running = False

    def open_file(self):
        pass

    def save_file(self):
        pass

    def configure_xbee_module(self):
        pass

    def configure_serial_port(self):
        pass

    def about_window(self):
        pass

    def documentation_window(self):
        pass

    def launch_rocket(self):
        self.canvas.delete("all")
        self.canvas.create_oval(190, 40, 210, 60, fill="white", outline="yellow")
        self.canvas.create_line(200, 60, 200, 100, fill="white", width=2)
        self.canvas.create_line(200, 60, 220, 80, fill="white", width=2)
        self.canvas.create_line(200, 60, 180, 80, fill="white", width=2)
        self.canvas.create_line(200, 100, 220, 120, fill="white", width=2)
        self.canvas.create_line(200, 100, 180, 120, fill="white", width=2)
        self.canvas.create_line(200, 120, 200, 140, fill="white", width=2)
        self.canvas.create_line(200, 140, 220, 160, fill="white", width=2)
        self.canvas.create_line(200, 140, 180, 160, fill="white", width=2)
        self.canvas.create_line(200, 160, 200, 180, fill="white", width=2)
        self.canvas.create_line(200, 180, 220, 200, fill="white", width=2)
        self.canvas.create_line(200, 180, 180, 200, fill="white", width=2)
        self.canvas.create_line(200, 200, 200, 220, fill="white", width=2)
        self.canvas.create_line(200, 220, 220, 240, fill="white", width=2)
        self.canvas.create_line(200, 220, 180, 240, fill="white", width=2)
        self.canvas.create_line(200, 240, 200, 260, fill="white", width=2)
        self.canvas.create_line(200, 260, 220, 280, fill="white", width=2)
        self.canvas.create_line(200, 260, 180, 280, fill="white", width=2)
        self.canvas.create_line(200, 280, 200, 300, fill="white", width=2)
        self.canvas.create_line(200, 300, 220, 320, fill="white", width=2)
        self.canvas.create_line(200, 300, 180, 320, fill="white", width=2)
        self.canvas.create_oval(190, 320, 210, 340, fill="red", outline="red")
        self.canvas.create_line(200, 340, 200, 360, fill="red", width=2)
        self.canvas.create_line(200, 360, 220, 380, fill="red", width=2)
        self.canvas.create_line(200, 360, 180, 380, fill="red", width=2)
        self.is_receiving = True
        self.timer_start_time = time.time()
        # self.update_rocket_position()
        self.timer_running = True
        self.update_timer()

    def start_receiving(self):
        self.is_receiving = True
        self.update_rocket_position()

    def stop_receiving(self):
        self.is_receiving = False

    def clear_log(self):
        pass
    def update_rocket_position(self):
        if self.is_receiving:
            # Simulate accelerometer data change (for demo purposes)
            self.simulated_accelerometer_angle += 2
            if self.simulated_accelerometer_angle >= 360:
                self.simulated_accelerometer_angle = 0

            # Update the rocket's angle according to the simulated accelerometer data
            self.rotate_rocket(self.simulated_accelerometer_angle)

            # Simulate altitude and acceleration changes
            altitude = random.uniform(0, 20)  # Simulating altitude data
            acceleration = random.uniform(-2, 2)  # Simulating acceleration data
            temperature = random.uniform(-20, 20)  # Simulating temperature data
            pressure = random.uniform(90000, 110000)  # Simulating pressure data
            humidity = random.uniform(0, 100)  # Simulating humidity data
            self.altitude_data.append(altitude)
            self.acceleration_data.append(acceleration)
            self.temperature_data.append(temperature)
            self.pressure_data.append(pressure)
            self.humidity_data.append(humidity)

            # Simulate parachute ejection
            if altitude > 10:
                self.parachute_status = "Ejected"
            else:
                self.parachute_status = "Not Ejected"
            self.parachute_status_label.config(text=f"Parachute Status: {self.parachute_status}")

            # Update GPS coordinates
            self.gps_coordinates = (self.gps_coordinates[0] + random.uniform(-0.0001, 0.0001),
                                    self.gps_coordinates[1] + random.uniform(-0.0001, 0.0001))
            self.gps_coordinates_label.config(text=f"GPS: {self.gps_coordinates}")

            # Update graph data
            self.update_graph_data()

            # Continue updating every 100 ms
            self.root.after(100, self.update_rocket_position)

    def rotate_rocket(self, angle):
        center_x, center_y = 200, 100
        points = [(200, 50), (230, 100), (230, 300), (170, 300), (170, 100)]
        new_points = []

        for x, y in points:
            x_rotated = center_x + (x - center_x) * math.cos(math.radians(angle)) - (y - center_y) * math.sin(math.radians(angle))
            y_rotated = center_y + (x - center_x) * math.sin(math.radians(angle)) + (y - center_y) * math.cos(math.radians(angle))
            new_points.append((x_rotated, y_rotated))

        self.canvas.coords(self.rocket, *new_points)

    def update_graph_data(self):
        # Update altitude graph
        self.ax_altitude.clear()
        self.ax_altitude.plot(self.altitude_data, color='blue')
        self.ax_altitude.set_title("Altitude (m)")
        self.ax_altitude.set_xlabel("Time")
        self.ax_altitude.set_ylabel("Altitude")
        self.canvas_altitude.draw()

        # Update acceleration graph
        self.ax_acceleration.clear()
        self.ax_acceleration.plot(self.acceleration_data, color='red')
        self.ax_acceleration.set_title("Acceleration (m/s²)")
        self.ax_acceleration.set_xlabel("Time")
        self.ax_acceleration.set_ylabel("Acceleration")
        self.canvas_acceleration.draw()

        # Update temperature graph
        self.ax_temperature.clear()
        self.ax_temperature.plot(self.temperature_data, color='green')
        self.ax_temperature.set_title("Temperature (°C)")
        self.ax_temperature.set_xlabel("Time")
        self.ax_temperature.set_ylabel("Temperature")
        self.canvas_temperature.draw()

        # # Update pressure graph
        # self.ax_pressure.clear()
        # self.ax_pressure.plot(self.pressure_data, color='purple')
        # self.ax_pressure.set_title("Pressure (Pa)")
        # self.ax_pressure.set_xlabel("Time")
        # self.ax_pressure.set_ylabel("Pressure")
        # self.canvas_pressure.draw()

        # Update humidity graph
        self.ax_humidity.clear()
        self.ax_humidity.plot(self.humidity_data, color='orange')
        self.ax_humidity.set_title("Humidity (%)")
        self.ax_humidity.set_xlabel("Time")
        self.ax_humidity.set_ylabel("Humidity")
        self.canvas_humidity.draw()

    def update_timer(self):
        if self.timer_running:
            elapsed_time = time.time() - self.timer_start_time
            minutes, seconds = divmod(elapsed_time, 60)
            hours, minutes = divmod(minutes, 60)
            self.timer_label.config(text=f"{int(hours):02d}:{int(minutes):02d}:{int(seconds):02d}")
            self.root.after(1000, self.update_timer)

# Create the main window
root = tk.Tk()
app = XBeeGroundStation(root)
root.mainloop()