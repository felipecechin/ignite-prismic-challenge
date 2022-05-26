import { GetStaticPaths, GetStaticProps } from 'next';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import * as prismicH from '@prismicio/helpers';
import { AiOutlineCalendar, AiOutlineClockCircle, AiOutlineUser } from 'react-icons/ai';
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
      body: string;
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const minutesToRead = Math.ceil(
    post.data.content.reduce((words, cur) => {
      return [
        ...words,
        ...cur.heading.split(/[,.\s]/),
        ...cur.body.split(/[,.\s]/),
      ];
    }, []).length / 200
  );
  console.log(minutesToRead);

  return (
    <>
      <div className={commonStyles.container}>
        <header className={styles.headerContent}>
          <Header />
        </header>
      </div>
      <div className={styles.banner}>
        <img src={post.data.banner.url} alt={post.data.title} />
      </div>
      <main className={commonStyles.container}>
        <div className={styles.post}>
          <h2 className={styles.title}>{post.data.title}</h2>
          <div className={styles.dateAuthorRead}>
            <time>
              <AiOutlineCalendar />
              {post.first_publication_date}
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
          {post.data.content.map(c => {
            return (
              <div key={c.heading} className={styles.content}>
                {c.heading}
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
  const postsResponse = await prismic.getByType('posts', {
    pageSize: 1,
  });

  return {
    paths: [],
    fallback: 'blocking',
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const prismic = getPrismicClient({});
  const { slug } = params;

  const response = await prismic.getByUID('posts', String(slug), {});

  const content = response.data.content.map(value => {
    return {
      heading: value.heading,
      body: prismicH.asHTML(value.body),
    };
  });

  const post = {
    first_publication_date: format(
      new Date(response.first_publication_date),
      `dd MMM yyyy`,
      {
        locale: ptBR,
      }
    ),
    data: {
      title: response.data.title,
      author: response.data.author,
      banner: {
        url: response.data.banner.url,
      },
      content,
    },
  };

  return {
    props: {
      post,
    },
    redirect: 60 * 30, // 30 minutes
  };
};
