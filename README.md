# AI-Driven-Student-Participation-Tracker

## By: Tan Jun Lin

### Briefly Introduction:

- This project specific designed for educators to track student attention and interest in virtual classrooms in real-time. By utilising combination of pre-trained AI models, this system will analyse the key elements such as facial expression, body language, and eye focus to categorise student participation level as interested, bored, or unfocused. The major purpose of this system is to provide educators with actionable insights so that they can dynamically modify their teaching strategies in real time based on student participation. This solution will assist educators in identifying disengagement early, allowing for timely interventions to boost student motivation and learning outcomes.

### First time setup the application

- Run below command to setup the docker container.
  - docker-compose up --build

### Instruction before use this application

1. Install requirement.txt in server folder
2. Uninstall keras and reinstall keras==2.12.0
3. In the keras_vggface/models.py

- change **from keras.engine.topology import get_source_inputs** to **from keras.utils.layer_utils import get_source_inputs**
