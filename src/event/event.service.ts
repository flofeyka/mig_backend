import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PageDto } from 'common/dto/page.dto';
import { SuccessRdo } from 'common/rdo/success.rdo';
import { fillDto } from 'common/utils/fillDto';
import StreamZip from 'node-stream-zip';
import { PrismaService } from 'prisma/prisma.service';
import { buffer } from 'stream/consumers';
import { MediaService } from '../media/media.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventRdo } from './rdo/event.rdo';
import { EventsRdo } from './rdo/events.rdo';

@Injectable()
export class EventService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mediaService: MediaService,
  ) {}

  async createEvent(dto: CreateEventDto): Promise<EventRdo> {
    const event = await this.prisma.event.create({
      data: dto,
    });

    return fillDto(EventRdo, event);
  }

  async processZip(zipPath: string): Promise<SuccessRdo> {
    try {
      const zip = new StreamZip.async({ file: zipPath });

      const entries = await zip.entries();

      const structure: {
        events: {
          name: string;
          flows?: {
            name: string;
            speeches?: {
              name: string;
              members?: {
                name: string;
                media?: Array<{
                  buffer: Buffer;
                  filename: string;
                }>;
              }[];
            }[];
          }[];
        }[];
      } = {
        events: [],
      };

      await Promise.all(
        Object.keys(entries).map(async (entryName) => {
          const entry = entries[entryName];

          if (entry.isDirectory) return;

          const parts = entryName.split('/');
          if (parts.length !== 5) {
            console.warn(`Skipping: invalid structure → ${entryName}`);
            return;
          }

          const [eventName, flowName, speechName, memberName, filename] = parts;

          let event = structure.events?.find((e) => e.name === eventName);
          if (!event) {
            event = { name: eventName, flows: [] };
            structure.events.push(event);
          }

          let flow = event.flows?.find((f) => f.name === flowName);
          if (!flow) {
            flow = { name: flowName, speeches: [] };
            event.flows?.push(flow);
          }

          let speech = flow.speeches?.find((s) => s.name === speechName);
          if (!speech) {
            speech = { name: speechName, members: [] };
            flow.speeches?.push(speech);
          }

          let member = speech.members?.find((m) => m.name === memberName);
          if (!member) {
            member = { name: memberName, media: [] };
            speech.members?.push(member);
          }

          try {
            const buffer = await zip.entryData(entryName);
            if (member?.media) {
              member.media.push({ buffer, filename });
            }
          } catch (error) {
            console.error(`Failed to extract stream for ${entryName}:`, error);
          }
        }),
      );

      await zip.close();

      if (structure.events?.length) {
        const getArray = <T>(arr: T[] | undefined): T[] => arr || [];
        await Promise.allSettled(
          getArray(structure.events).map(async (event) => {
            console.log(`Processing Event: ${event.name}`);

            try {
              // 1. СОЗДАНИЕ EVENT
              const createdEvent = await this.prisma.event.create({
                data: {
                  name: event.name,
                  date: new Date(),
                },
              });
              console.log(`✅ Event created: ${createdEvent.id}`);

              // 2. Итерация по Flows
              await Promise.all(
                getArray(event.flows).map(async (flow) => {
                  try {
                    // 2.1. СОЗДАНИЕ FLOW
                    const createdFlow = await this.prisma.flow.create({
                      data: {
                        name: flow.name,
                        from: new Date(),
                        to: new Date(),
                        eventId: createdEvent.id,
                      },
                    });
                    console.log(`  ✅ Flow created: ${createdFlow.id}`);

                    // 3. Итерация по Speeches
                    await Promise.all(
                      getArray(flow.speeches).map(async (speech) => {
                        try {
                          // 3.1. СОЗДАНИЕ SPEECH
                          const createdSpeech = await this.prisma.speech.create(
                            {
                              data: {
                                name: speech.name,
                                flowId: createdFlow.id,
                              },
                            },
                          );
                          console.log(
                            `    ✅ Speech created: ${createdSpeech.id}`,
                          );

                          // 4. Итерация по Members
                          await Promise.all(
                            getArray(speech.members).map(
                              async (member, index) => {
                                console.log(
                                  `    Processing Member [${index + 1}/${
                                    getArray(speech.members).length
                                  }]`,
                                );
                                try {
                                  // 4.1. СОЗДАНИЕ MEMBER
                                  const createdMember =
                                    await this.prisma.member.create({
                                      data: {
                                        speechId: createdSpeech.id,
                                      },
                                    });
                                  console.log(
                                    `      ✅ Member created: ${createdMember.id}`,
                                  );

                                  const mediaDataPromises = getArray(
                                    member.media,
                                  ).map(async (media, mediaIndex) => {
                                    console.log(
                                      `      Uploading Media [${mediaIndex + 1}/${
                                        getArray(member.media).length
                                      }]: ${media.filename}`,
                                    );
                                    try {
                                      const { filename, preview, order } =
                                        await this.mediaService.uploadFile(
                                          createdMember.id,
                                          mediaIndex + 1,
                                          {
                                            buffer: media.buffer,
                                            originalname: media.filename,
                                          },
                                        );
                                      console.log(
                                        `Media successfully uploaded [${mediaIndex + 1}/${
                                          getArray(member.media).length
                                        }]`,
                                      );

                                      return {
                                        filename,
                                        preview,
                                        order,
                                        memberId: createdMember.id,
                                      };
                                    } catch (uploadError) {
                                      console.error(
                                        `      ❌ Media Upload Failed for ${media.filename}:`,
                                        uploadError,
                                      );
                                      return null;
                                    }
                                  });

                                  const uploadedMediaData = (
                                    await Promise.all(mediaDataPromises)
                                  ).filter((data) => !!data) as {
                                    filename: string;
                                    preview: string;
                                    order: number;
                                    memberId: string;
                                  }[];

                                  if (uploadedMediaData.length > 0) {
                                    await this.prisma.media.createMany({
                                      data: uploadedMediaData,
                                    });
                                    console.log(
                                      `      ✅ Created ${uploadedMediaData.length} media records.`,
                                    );
                                  }
                                } catch (memberError) {
                                  console.error(
                                    `    ❌ Member Creation Failed for ${member.name}:`,
                                    memberError,
                                  );
                                }
                              },
                            ),
                          );
                        } catch (speechError) {
                          console.error(
                            `  ❌ Speech Creation Failed for ${speech.name}:`,
                            speechError,
                          );
                        }
                      }),
                    );
                  } catch (flowError) {
                    console.error(
                      `❌ Flow Creation Failed for ${flow.name}:`,
                      flowError,
                    );
                  }
                }),
              );
            } catch (eventError) {
              console.error(
                `❌ Event Creation Failed for ${event.name}:`,
                eventError,
              );
            }
          }),
        );
      }

      console.log('success');
      return fillDto(SuccessRdo, { success: true });
    } catch (e) {
      console.error(e);
      throw new BadRequestException('Bad file');
    }
  }

  async updateEvent(id: string, dto: UpdateEventDto): Promise<EventRdo> {
    try {
      const event = await this.prisma.event.update({
        where: { id },
        data: dto,
      });

      return fillDto(EventRdo, event);
    } catch (e) {
      console.error(e);
      throw new NotFoundException('Event not found');
    }
  }

  async deleteEvent(id: string): Promise<SuccessRdo> {
    try {
      await this.prisma.event.delete({ where: { id } });

      return fillDto(SuccessRdo, { success: true });
    } catch (e) {
      console.error(e);
      throw new NotFoundException('Event not found');
    }
  }

  async fetchEvents(dto: PageDto): Promise<EventsRdo> {
    const { page = '1', limit = '15' } = dto;
    const where = {};

    const [total, events] = await Promise.all([
      this.prisma.event.count({ where }),
      this.prisma.event.findMany({
        where,
        skip: (+page - 1) * +limit,
        take: +limit,
        include: {
          flows: {
            take: 1,
            include: {
              speeches: {
                take: 1,
                include: {
                  members: {
                    take: 1,
                    include: {
                      media: {
                        take: 1,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      }),
    ]);

    return fillDto(EventsRdo, {
      events: events.map((event) => ({
        ...event,
        lastPhoto: event.flows[0]?.speeches?.[0]?.members?.[0]?.media,
      })),
      total,
    });
  }

  async fetchEvent(id: string): Promise<EventRdo> {
    const where = { id };

    const event = await this.prisma.event.findUnique({
      where,
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return fillDto(EventRdo, event);
  }
}
