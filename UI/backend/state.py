
class Settings:
    def __init__(self):
        self.global_settings = None
        self.rooms = None
        self.apertures = None
        self.wind_definition = None

class State:
    def __init__(self):
        self.running = False
        self.results = None
        self.settings = Settings()
        self.simulation = None

state_singleton = State()

def get_state()->State:
    return state_singleton