const int L_DIR = 8;
const int L_PWM = 9;
const int L_ENC_A = 2;
const int L_ENC_B = 4;

const int R_DIR = 7;
const int R_PWM = 6;
const int R_ENC_A = 3;
const int R_ENC_B = 5;

const int ACT1_PWM = 10;
const int ACT1_DIR = 12;
const int ACT2_PWM = 11;
const int ACT2_DIR = 13;

const int ACT_SPEED = 150;

volatile long left_count = 0;
volatile long right_count = 0;

String inputString = "";
bool stringComplete = false;
unsigned long lastPublishTime = 0;

void ISR_Left() {
  if (digitalRead(L_ENC_B) == LOW) {
    left_count++;
  } else {
    left_count--;
  }
}

void ISR_Right() {
  if (digitalRead(R_ENC_B) == LOW) {
    right_count++;
  } else {
    right_count--;
  }
}

void setMotor(int dirPin, int pwmPin, int speed) {
  speed = constrain(speed, -255, 255);
  if (speed > 0) {
    digitalWrite(dirPin, LOW);
    analogWrite(pwmPin, speed);
  } else if (speed < 0) {
    digitalWrite(dirPin, HIGH);
    analogWrite(pwmPin, -speed);
  } else {
    analogWrite(pwmPin, 0);
  }
}

void moveUp() {
  digitalWrite(ACT1_DIR, LOW);
  digitalWrite(ACT2_DIR, LOW);
  analogWrite(ACT1_PWM, ACT_SPEED);
  analogWrite(ACT2_PWM, ACT_SPEED);
}

void moveDown() {
  digitalWrite(ACT1_DIR, HIGH);
  digitalWrite(ACT2_DIR, HIGH);
  analogWrite(ACT1_PWM, ACT_SPEED);
  analogWrite(ACT2_PWM, ACT_SPEED);
}

void stopActuators() {
  analogWrite(ACT1_PWM, 0);
  analogWrite(ACT2_PWM, 0);
}

void setup() {
  Serial.begin(115200);

  pinMode(L_DIR, OUTPUT);
  pinMode(L_PWM, OUTPUT);
  pinMode(R_DIR, OUTPUT);
  pinMode(R_PWM, OUTPUT);

  pinMode(L_ENC_A, INPUT_PULLUP);
  pinMode(L_ENC_B, INPUT_PULLUP);
  pinMode(R_ENC_A, INPUT_PULLUP);
  pinMode(R_ENC_B, INPUT_PULLUP);

  attachInterrupt(digitalPinToInterrupt(L_ENC_A), ISR_Left, RISING);
  attachInterrupt(digitalPinToInterrupt(R_ENC_A), ISR_Right, RISING);

  pinMode(ACT1_PWM, OUTPUT);
  pinMode(ACT1_DIR, OUTPUT);
  pinMode(ACT2_PWM, OUTPUT);
  pinMode(ACT2_DIR, OUTPUT);
  stopActuators();

  Serial.println("MDD10A Linear Actuators + Wheel Encoders Control");
  Serial.println("u : UP, d : DOWN, s : STOP (actuators)");
  Serial.println("c,pwm_L,pwm_R : wheel motor command");
}

void loop() {
  if (stringComplete) {
    parseCommand(inputString);
    inputString = "";
    stringComplete = false;
  }

  if (millis() - lastPublishTime >= 20) {
    long l_cnt, r_cnt;

    noInterrupts();
    l_cnt = left_count;
    r_cnt = right_count;
    interrupts();

    Serial.print("e,");
    Serial.print(l_cnt);
    Serial.print(",");
    Serial.println(r_cnt);

    lastPublishTime = millis();
  }
}

void serialEvent() {
  while (Serial.available()) {
    char inChar = (char)Serial.read();
    inputString += inChar;
    if (inChar == '\n') {
      stringComplete = true;
    }
  }
}

void parseCommand(String data) {
  data.trim();
  if (data.length() == 0) return;

  char c = data.charAt(0);
  if (c >= 'A' && c <= 'Z') {
    c = c - 'A' + 'a';
  }

  if (c == 'u') {
    moveUp();
    Serial.println("ACTUATOR UP");
    return;
  } else if (c == 'd') {
    moveDown();
    Serial.println("ACTUATOR DOWN");
    return;
  } else if (c == 's') {
    stopActuators();
    Serial.println("ACTUATOR STOP");
    return;
  }

  if (c == 'c') {
    int firstComma = data.indexOf(',');
    int secondComma = data.indexOf(',', firstComma + 1);
    if (firstComma > 0 && secondComma > 0) {
      int pwm_L = data.substring(firstComma + 1, secondComma).toInt();
      int pwm_R = data.substring(secondComma + 1).toInt();
      setMotor(L_DIR, L_PWM, pwm_L);
      setMotor(R_DIR, R_PWM, pwm_R);
    }
  }
}
