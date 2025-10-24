import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function main() {
  // Очищаем данные (опционально)
  await prisma.$transaction([
    prisma.token.deleteMany({}),
    prisma.media.deleteMany({}),
    prisma.member.deleteMany({}),
    prisma.speech.deleteMany({}),
    prisma.flow.deleteMany({}),
    prisma.event.deleteMany({}),
    prisma.user.deleteMany({}),
  ]);

  // Создаём пользователей
  const users = await prisma.user.createMany({
    data: Array.from({ length: 5 }).map(() => ({
      fullname: faker.person.fullName(),
      email: faker.internet.email(),
      login: faker.internet.username(),
      password: faker.internet.password(),
      isAdmin: faker.datatype.boolean(),
    })),
  });

  // Получаем созданных пользователей для связей
  const allUsers = await prisma.user.findMany();
  
  // Создаём токены для пользователей
  await prisma.token.createMany({
    data: allUsers.map(user => ({
      token: faker.string.alphanumeric(32),
      userId: user.id,
    })),
  });

  // Создаём события
  const events = await prisma.event.createMany({
    data: Array.from({ length: 1 }).map(() => ({
      name: faker.lorem.sentence(3),
      date: faker.date.future(),
      price: faker.number.int({ min: 100, max: 5000 }),
    })),
  });

  // Получаем события для связей
  const allEvents = await prisma.event.findMany();

  // Создаём потоки (Flow)
  const flows = await prisma.flow.createMany({
    data: allEvents.map(event => ({
      name: faker.lorem.word(),
      from: faker.date.past(),
      to: faker.date.future(),
      eventId: event.id,
    })),
  });

  // Получаем потоки для связей
  const allFlows = await prisma.flow.findMany();

  // Создаём речи (Speech)
  await prisma.speech.createMany({
    data: allFlows.map(flow => ({
      name: faker.lorem.sentence(),
      flowId: flow.id,
    })),
  });

  // Получаем речи для связей
  const allSpeeches = await prisma.speech.findMany();

  await prisma.member.createMany({
    data: allSpeeches.map(speech => ({
      speechId: speech.id,
      userId: faker.helpers.arrayElement(allUsers).id,
    })),
  });

  // Получаем участников для связей
  const allMembers = await prisma.member.findMany();

  // Создаём медиа
  await prisma.media.createMany({
    data: allMembers.map(member => ({
      filename: faker.system.fileName(),
      fullVersion: 'https://i.wfolio.ru/x/KfN2JhbB89-m6UeUSQ-43b-4LTDPyZVn/q6sVLUvjujnOk6mXbO2srbIKpPlcOqy0/t7rVx8PT5NFW95R5iPfYgEbcz9T9DM03/mjHu5nb3MiY0pLaVSfnIEvvsgGTLYWd3/DB3ADSLxnrANMZCME7ysOwZ5ppzwWD-U/3xE7Ik44Yjqhk_JEy-q2uVtvyRuwD_n5/XCz-fesLiD6qTVz1ag2HMeFUjLzd9iyR/RY_Y4VnfKFm87S90G752vO-HhHC0gcoP/f0eRQIpSGJgJ4vPyI-zNseo_briwt2b7/az0Ne6K2wDbgkdDAiVwru48Si3luvdZL/T_vk0QPJoE94vfZkFPFbLw0LwohAQFjC/M_wQ3xOhcdMaWY4_rxkeyvsCsSsbt_lo/ksAryHPyOD920vaFuOoo3CRDiWryC4SX/iBszc0WhOqp1J_MEVqbZrhlE69MM_8Ah/kuH6dOPbw2j4kLuFJJlQfMTz32uoUctp/2uD48ppK0gm5WA5IjayxG-JB0LAVwLc6/cwif8FPDWtG8cPvTfvDZ-irWlSuNzXjC/jgZxa5x9ue8.jpg',
      preview: 'https://i.wfolio.ru/x/KfN2JhbB89-m6UeUSQ-43b-4LTDPyZVn/q6sVLUvjujnOk6mXbO2srbIKpPlcOqy0/t7rVx8PT5NFW95R5iPfYgEbcz9T9DM03/mjHu5nb3MiY0pLaVSfnIEvvsgGTLYWd3/DB3ADSLxnrANMZCME7ysOwZ5ppzwWD-U/3xE7Ik44Yjqhk_JEy-q2uVtvyRuwD_n5/XCz-fesLiD6qTVz1ag2HMeFUjLzd9iyR/RY_Y4VnfKFm87S90G752vO-HhHC0gcoP/f0eRQIpSGJgJ4vPyI-zNseo_briwt2b7/az0Ne6K2wDbgkdDAiVwru48Si3luvdZL/T_vk0QPJoE94vfZkFPFbLw0LwohAQFjC/M_wQ3xOhcdMaWY4_rxkeyvsCsSsbt_lo/ksAryHPyOD920vaFuOoo3CRDiWryC4SX/iBszc0WhOqp1J_MEVqbZrhlE69MM_8Ah/kuH6dOPbw2j4kLuFJJlQfMTz32uoUctp/2uD48ppK0gm5WA5IjayxG-JB0LAVwLc6/cwif8FPDWtG8cPvTfvDZ-irWlSuNzXjC/jgZxa5x9ue8.jpg',
      order: faker.number.int({ min: 1, max: 10 }),
      price: faker.number.int({ min: 50, max: 1000 }),
      memberId: member.id,
    })),
  });

  console.log('Тестовые данные успешно созданы!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
