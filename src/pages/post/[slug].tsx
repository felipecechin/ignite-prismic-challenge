import { GetStaticPaths, GetStaticProps } from 'next';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import PrismicDOM from 'prismic-dom';
import {
  AiOutlineCalendar,
  AiOutlineClockCircle,
  AiOutlineUser,
} from 'react-icons/ai';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { getPrismicClient } from '../../services/prismic';
import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import Header from '../../components/Header';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const router = useRouter();
  if (router.isFallback) {
    return <div>Carregando...</div>;
  }

  const minutesToRead = Math.ceil(
    post.data.content.reduce((words, cur) => {
      return [
        ...words,
        ...cur.heading.split(/[,.\s]/),
        ...PrismicDOM.RichText.asText(cur.body).split(/[,.\s]/),
      ];
    }, []).length / 200
  );

  return (
    <>
      <Head>
        <title>Post | {post.data.title}</title>
      </Head>
      <div className={commonStyles.container}>
        <header className={styles.headerContent}>
          <Header />
        </header>
      </div>
      <div className={styles.banner}>
        <img src={post.data.banner.url} alt={post.data.title} />
      </div>
      <main className={`${commonStyles.container} ${commonStyles.finalDiv}`}>
        <div className={styles.post}>
          <h2 className={styles.title}>{post.data.title}</h2>
          <div className={styles.dateAuthorRead}>
            <time>
              <AiOutlineCalendar />
              {format(new Date(post.first_publication_date), `dd MMM yyyy`, {
                locale: ptBR,
              })}
            </time>
            <span>
              <AiOutlineUser />
              {post.data.author}
            </span>
            <span>
              <AiOutlineClockCircle />
              {minutesToRead} min
            </span>
          </div>
          {post.data.content.map(content => {
            return (
              <div key={content.heading} className={styles.content}>
                <h2 className={styles.contentHeading}>{content.heading}</h2>

                <div
                  className={styles.contentBody}
                  dangerouslySetInnerHTML={{
                    __html: PrismicDOM.RichText.asHtml(content.body),
                  }}
                />
              </div>
            );
          })}
        </div>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient({});
  const postsResponse = await prismic.getByType('posts');

  const postPaths = postsResponse.results.map(post => {
    return { params: { slug: String(post.uid) } };
  });

  return {
    paths: [...postPaths],
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const prismic = getPrismicClient({});
  const { slug } = params;

  const response = await prismic.getByUID('posts', String(slug), {});

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      author: response.data.author,
      banner: {
        url: response.data.banner.url,
      },
      content: response.data.content,
    },
  };

  return {
    props: {
      post,
    },
    redirect: 60 * 30, // 30 minutes
  };
};
