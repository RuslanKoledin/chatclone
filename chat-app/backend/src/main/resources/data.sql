DELETE FROM MESSAGE_READ_BY;
DELETE FROM CHAT_MESSAGES;
DELETE FROM CHAT_ADMINS;
DELETE FROM CHAT_USERS;
DELETE FROM MESSAGE;
DELETE FROM CHAT;
DELETE FROM APP_USER;

-- Тестовые пользователи: r_koledin / test и b_bob / test
-- Пароль пустой — аутентификация через AD, пароль не хранится
INSERT INTO APP_USER(id, username, email, password, full_name, department, title, last_seen, is_online)
VALUES ('be900497-cc68-4504-9b99-4e5deaf1e6c0', 'r_koledin', 'r.koledin@cbk.kg',
        '', 'Koledin Ruslan', 'ОПО', 'Специалист', NULL, false),
       ('f290f384-60ba-4cdd-af96-26c88ede0264', 'b_bob', 'b.bob@cbk.kg',
        '', 'Bob Builder', 'IT отдел', 'Разработчик', NULL, false),
       ('7a9f7b3f-8ab7-46d7-8a16-2b5b8c4c8a1a', 'a_tom', 'a.tom@cbk.kg',
        '', 'Tom Adams', 'Бухгалтерия', 'Бухгалтер', NULL, false);

-- Чат между r_koledin и b_bob
INSERT INTO CHAT(id, chat_name, is_group, created_by_id)
VALUES ('0bd20a41-4d23-4c4e-a8aa-8e46743f9ee4', 'Ruslan and Bob', false, 'be900497-cc68-4504-9b99-4e5deaf1e6c0');

INSERT INTO CHAT_USERS(chat_id, users_id)
VALUES ('0bd20a41-4d23-4c4e-a8aa-8e46743f9ee4', 'be900497-cc68-4504-9b99-4e5deaf1e6c0'),
       ('0bd20a41-4d23-4c4e-a8aa-8e46743f9ee4', 'f290f384-60ba-4cdd-af96-26c88ede0264');

-- Тестовые сообщения
INSERT INTO MESSAGE(id, content, time_stamp, user_id, chat_id)
VALUES ('a284a44a-7b28-45da-8463-3a35417715f0', 'Привет! Как дела?', '2024-04-22 20:01:07.535241 +00:00',
        'be900497-cc68-4504-9b99-4e5deaf1e6c0', '0bd20a41-4d23-4c4e-a8aa-8e46743f9ee4'),
       ('37afbdc4-89b4-4961-b825-bb4d666e5442', 'Привет! Всё отлично, спасибо!', '2024-04-22 20:02:08.535241 +00:00',
        'f290f384-60ba-4cdd-af96-26c88ede0264', '0bd20a41-4d23-4c4e-a8aa-8e46743f9ee4');

INSERT INTO CHAT_MESSAGES(chat_id, messages_id)
VALUES ('0bd20a41-4d23-4c4e-a8aa-8e46743f9ee4', 'a284a44a-7b28-45da-8463-3a35417715f0'),
       ('0bd20a41-4d23-4c4e-a8aa-8e46743f9ee4', '37afbdc4-89b4-4961-b825-bb4d666e5442');

INSERT INTO MESSAGE_READ_BY(message_id, read_by)
VALUES ('a284a44a-7b28-45da-8463-3a35417715f0', 'be900497-cc68-4504-9b99-4e5deaf1e6c0'),
       ('37afbdc4-89b4-4961-b825-bb4d666e5442', 'be900497-cc68-4504-9b99-4e5deaf1e6c0'),
       ('a284a44a-7b28-45da-8463-3a35417715f0', 'f290f384-60ba-4cdd-af96-26c88ede0264'),
       ('37afbdc4-89b4-4961-b825-bb4d666e5442', 'f290f384-60ba-4cdd-af96-26c88ede0264');

-- Групповой чат "Команда"
INSERT INTO CHAT(id, chat_name, is_group, created_by_id)
VALUES ('1bd20a41-4d23-4c4e-a8aa-8e46743f9ee5', 'Команда', true, 'be900497-cc68-4504-9b99-4e5deaf1e6c0');

INSERT INTO CHAT_USERS(chat_id, users_id)
VALUES ('1bd20a41-4d23-4c4e-a8aa-8e46743f9ee5', 'be900497-cc68-4504-9b99-4e5deaf1e6c0'),
       ('1bd20a41-4d23-4c4e-a8aa-8e46743f9ee5', 'f290f384-60ba-4cdd-af96-26c88ede0264'),
       ('1bd20a41-4d23-4c4e-a8aa-8e46743f9ee5', '7a9f7b3f-8ab7-46d7-8a16-2b5b8c4c8a1a');

INSERT INTO CHAT_ADMINS(admins_id, chat_id)
VALUES ('be900497-cc68-4504-9b99-4e5deaf1e6c0', '1bd20a41-4d23-4c4e-a8aa-8e46743f9ee5');

-- Сообщение в групповом чате
INSERT INTO MESSAGE(id, content, time_stamp, user_id, chat_id)
VALUES ('c284a44a-7b28-45da-8463-3a35417715f1', 'Привет всем в группе!', '2024-04-23 10:00:00.000000 +00:00',
        'be900497-cc68-4504-9b99-4e5deaf1e6c0', '1bd20a41-4d23-4c4e-a8aa-8e46743f9ee5');

INSERT INTO CHAT_MESSAGES(chat_id, messages_id)
VALUES ('1bd20a41-4d23-4c4e-a8aa-8e46743f9ee5', 'c284a44a-7b28-45da-8463-3a35417715f1');
