import { connect, ConsumeMessage } from 'amqplib';
import { match, matchConsumer } from './match-worker';
import * as common from 'react-video-call-common';

matchConsumer();
